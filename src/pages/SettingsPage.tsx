import { useCallback, useEffect, useState } from 'react';
import { defaultNotificationPreferences, notificationRepository } from '../features/notifications/repository';
import { notificationService } from '../features/notifications/service';
import type { NotificationPreferences } from '../features/notifications/models';
import { exportService, EXPORTED_SECTIONS } from '../features/settings/exportService';
import type { UploadedDocument, UserSettings } from '../features/settings/models';
import { defaultSettings, settingsRepository } from '../features/settings/repository';
import { DELETE_DATA_PHRASE, privacyService } from '../features/settings/privacyService';
import { localDataImportService, type LocalImportPreview } from '../features/settings/localDataImportService';
import { useAuth } from '../hooks/useAuth';
import { hasSupabaseConfiguration } from '../lib/supabaseRepository.ts';
import './AccountPages.css';

export default function SettingsPage() {
  const { changePassword, signOutEverywhere, deleteAccount } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(defaultSettings());
  const [notifications, setNotifications] = useState<NotificationPreferences>(defaultNotificationPreferences());
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [includeAiHistory, setIncludeAiHistory] = useState(false);
  const [deletePhrase, setDeletePhrase] = useState('');
  const [deleteAccountPhrase, setDeleteAccountPhrase] = useState('');
  const [deleteAccountPassword, setDeleteAccountPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [localPreview, setLocalPreview] = useState<LocalImportPreview | null>(null);
  const [importConfirmed, setImportConfirmed] = useState(false);
  const [message, setMessage] = useState('');
  const fetchSettings = useCallback(async () => { const [savedSettings, savedNotifications, savedDocuments] = await Promise.all([settingsRepository.getSettings(), notificationService.getPreferences(), privacyService.listDocuments()]); return { savedSettings, savedNotifications, savedDocuments }; }, []);
  const applySettings = useCallback(({ savedSettings, savedNotifications, savedDocuments }: Awaited<ReturnType<typeof fetchSettings>>) => { setSettings(savedSettings); setNotifications(savedNotifications); setDocuments(savedDocuments); document.documentElement.dataset.theme = savedSettings.theme; }, []);
  const load = useCallback(async () => applySettings(await fetchSettings()), [applySettings, fetchSettings]);
  useEffect(() => {
    void fetchSettings().then(applySettings); const settingsUnsubscribe = settingsRepository.subscribe(() => void fetchSettings().then(applySettings)); const notificationsUnsubscribe = notificationRepository.subscribe(() => void fetchSettings().then(applySettings)); return () => { settingsUnsubscribe(); notificationsUnsubscribe(); };
  }, [applySettings, fetchSettings]);
  useEffect(() => { if (hasSupabaseConfiguration()) void localDataImportService.preview().then(setLocalPreview).catch((error) => setMessage(error instanceof Error ? error.message : 'Unable to inspect local data.')); }, []);
  const save = async () => { const now = new Date().toISOString(); const value = { ...settings, updatedAt: now, privacyUpdatedAt: now }; await Promise.all([settingsRepository.saveSettings(value), notificationService.savePreferences(notifications)]); document.documentElement.dataset.theme = value.theme; setSettings(value); setMessage('Settings saved locally.'); };
  const deleteDocument = async (document: UploadedDocument) => { if (!window.confirm(`Delete ${document.fileName} from ${document.sourceModule}?`)) return; try { await privacyService.deleteDocument(document, true); setDocuments(await privacyService.listDocuments()); setMessage('Document and its owned file record deleted.'); } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to delete document.'); } };
  const exportData = async () => { const payload = await exportService.prepare({ includeAiHistory }); exportService.download(payload); setMessage('Student data export downloaded.'); };
  const changeCurrentPassword = async () => {
    if (newPassword.length < 8) return setMessage('Use a new password with at least 8 characters.');
    try { await changePassword(currentPassword, newPassword); setCurrentPassword(''); setNewPassword(''); setMessage('Password updated.'); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to update password.'); }
  };
  const logoutEverywhere = async () => {
    try { await signOutEverywhere(); window.location.assign('/login'); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to sign out everywhere.'); }
  };
  const removeAccount = async () => {
    try { await deleteAccount(deleteAccountPassword, deleteAccountPhrase); window.location.assign('/'); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to delete account.'); }
  };

  const importLocalData = async () => {
    try { await localDataImportService.import(importConfirmed); setLocalPreview(await localDataImportService.preview()); setMessage('Local data imported. Your browser copy is still intact until you remove it.'); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to import local data.'); }
  };
  return <section className="account-page"><header><h1>Settings</h1><p>Preferences, privacy, and data controls.</p></header>{message && <p className="account-message" role="status">{message}</p>}
    <section className="account-card"><h2>Appearance</h2><label>Theme<select value={settings.theme} onChange={(event) => setSettings({ ...settings, theme: event.target.value as UserSettings['theme'] })}><option value="light">Light</option><option value="dark">Dark</option><option value="system">System</option></select></label></section>
    <section className="account-card"><h2>Language</h2><label>Application language<select value={settings.language} onChange={(event) => setSettings({ ...settings, language: event.target.value as UserSettings['language'] })}><option>English</option><option>Hindi</option><option>Marathi</option></select></label></section>
    <section className="account-card"><h2>Notifications</h2><div className="account-grid"><label className="check"><input type="checkbox" checked={notifications.enabled} onChange={(event) => setNotifications({ ...notifications, enabled: event.target.checked })} />Enable in-app notifications</label><label>Assignment reminder hours<input type="number" min="1" value={notifications.assignmentReminderHours} onChange={(event) => setNotifications({ ...notifications, assignmentReminderHours: Number(event.target.value) })} /></label><label>Exam reminder days<input type="number" min="1" value={notifications.examReminderDays} onChange={(event) => setNotifications({ ...notifications, examReminderDays: Number(event.target.value) })} /></label><label>Lecture reminder minutes<input type="number" min="0" value={notifications.lectureReminderMinutes} onChange={(event) => setNotifications({ ...notifications, lectureReminderMinutes: Number(event.target.value) })} /></label><label className="check"><input type="checkbox" checked={notifications.attendanceAlerts} onChange={(event) => setNotifications({ ...notifications, attendanceAlerts: event.target.checked })} />Attendance alerts</label><label className="check"><input type="checkbox" checked={notifications.noticeAlerts} onChange={(event) => setNotifications({ ...notifications, noticeAlerts: event.target.checked })} />Notice alerts</label><label className="check"><input type="checkbox" checked={notifications.atktAlerts} onChange={(event) => setNotifications({ ...notifications, atktAlerts: event.target.checked })} />ATKT alerts</label></div></section>
    <button className="primary" onClick={() => void save()}>Save settings</button>

    <section className="account-card"><h2>Documents</h2>{documents.length === 0 ? <p className="account-empty">No uploaded Notes or Notice Intelligence documents.</p> : <div className="document-list">{documents.map((document) => <article key={document.id}><div><strong>{document.fileName}</strong><p>{document.sourceModule} · uploaded {new Date(document.uploadedAt).toLocaleString()} · updated {new Date(document.updatedAt).toLocaleString()}</p></div><button className="danger" onClick={() => void deleteDocument(document)}>Delete</button></article>)}</div>}</section>

    <section className="account-card" id="privacy-policy"><h2>AI and Privacy</h2><label className="check"><input type="checkbox" checked={settings.allowStudyAiUploadedMaterials} onChange={(event) => setSettings({ ...settings, allowStudyAiUploadedMaterials: event.target.checked })} />Allow approved uploaded material to be used by Study AI</label><p>Study AI answers should be grounded only in approved uploaded material. Source: {settings.privacySource}; last updated {settings.privacyUpdatedAt ? new Date(settings.privacyUpdatedAt).toLocaleString() : 'not saved'}.</p><div className="account-actions"><button onClick={() => { if (window.confirm('Delete local Study AI generation history?')) void privacyService.deleteAiHistory(true).then(() => setMessage('AI generation history deleted.')); }}>Delete AI generation history</button><a href="#privacy-policy">Privacy policy</a></div></section>

    <section className="account-card"><h2>Data Management</h2><p>The versioned JSON export includes:</p><ul>{EXPORTED_SECTIONS.map((section) => <li key={section}>{section}</li>)}</ul><label className="check"><input type="checkbox" checked={includeAiHistory} onChange={(event) => setIncludeAiHistory(event.target.checked)} />Explicitly include AI history</label><label className="check"><input type="checkbox" checked={settings.confirmBeforeDataSave} onChange={(event) => setSettings({ ...settings, confirmBeforeDataSave: event.target.checked })} />Ask for confirmation before data-saving actions</label><button onClick={() => void exportData()}>Export student data as JSON</button><p>Passwords, tokens, API keys, and secret keys are never exported.</p></section>
    {localPreview && <section className="account-card"><h2>Import this browser’s local data</h2>{localPreview.alreadyImported ? <p>This browser data has already been imported. Local records were left untouched.</p> : localPreview.total === 0 ? <p>No CampusFlow local records were found.</p> : <><p>{localPreview.total} records are ready to copy to your account:</p><ul>{localPreview.counts.map((item) => <li key={item.label}>{item.label}: {item.count}</li>)}</ul><label className="check"><input type="checkbox" checked={importConfirmed} onChange={(event) => setImportConfirmed(event.target.checked)} />I reviewed this preview and want to import it once.</label><button disabled={!importConfirmed} onClick={() => void importLocalData()}>Import local data</button><p>Your browser data is not removed by import. Use the typed confirmation below only after checking the imported records.</p></>}</section>}

    <section className="account-card"><h2>Account Security</h2><div className="account-grid"><label>Current password<input autoComplete="current-password" type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} /></label><label>New password<input autoComplete="new-password" type="password" minLength={8} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} /></label></div><div className="account-actions"><button onClick={() => void changeCurrentPassword()}>Change password</button><button onClick={() => void logoutEverywhere()}>Logout from all devices</button></div></section>
    <section className="account-card danger-zone"><h2>Danger Zone</h2><p>The action below deletes only explicitly whitelisted CampusFlow records held in this browser. It never deletes your server account.</p><label>Type <strong>{DELETE_DATA_PHRASE}</strong><input value={deletePhrase} onChange={(event) => setDeletePhrase(event.target.value)} /></label><button className="danger" disabled={deletePhrase !== DELETE_DATA_PHRASE} onClick={() => { if (window.confirm('Delete all CampusFlow local data from this browser?')) void privacyService.deleteLocalDemoData(deletePhrase).then(() => { setMessage('CampusFlow local data deleted. Server account unchanged.'); setDeletePhrase(''); void load(); }); }}>Delete local CampusFlow data</button><hr /><h3>Delete server account</h3><p>This permanently removes your account and CampusFlow data. Re-enter your password and type <strong>DELETE MY ACCOUNT</strong>.</p><label>Current password<input type="password" autoComplete="current-password" value={deleteAccountPassword} onChange={(event) => setDeleteAccountPassword(event.target.value)} /></label><label>Confirmation<input value={deleteAccountPhrase} onChange={(event) => setDeleteAccountPhrase(event.target.value)} /></label><button className="danger" disabled={deleteAccountPhrase !== 'DELETE MY ACCOUNT' || !deleteAccountPassword} onClick={() => { if (window.confirm('Permanently delete your CampusFlow account?')) void removeAccount(); }}>Delete server account</button></section>
  </section>;
}
