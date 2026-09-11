import React, { useContext, useState } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import { Settings as SettingsIcon, Loader2, AlertTriangle } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { UserContext } from '../context/UserContext'
import { Input } from '../components/Input'
import axiosInstance from '../utils/axiosInstance'
import { API_PATHS } from '../utils/apiPaths'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

const SettingsCard = ({ title, description, children, danger = false }) => (
    <div className={`bg-white dark:bg-gray-900 border rounded-2xl p-6 mb-6 ${danger ? 'border-red-200 dark:border-red-500/30' : 'border-gray-100 dark:border-gray-800'}`}>
        <h2 className={`font-bold mb-1 ${danger ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>{title}</h2>
        {description && <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{description}</p>}
        {children}
    </div>
)

const ProfileSection = () => {
    const { user, updateUserFields } = useContext(UserContext)
    const [name, setName] = useState(user?.name || '')
    const [email, setEmail] = useState(user?.email || '')
    const [saving, setSaving] = useState(false)

    const dirty = name !== user?.name || email !== user?.email

    const handleSave = async (e) => {
        e.preventDefault()
        if (!name.trim()) { toast.error('Name cannot be empty'); return }
        setSaving(true)
        try {
            const res = await axiosInstance.put(API_PATHS.AUTH.UPDATE_PROFILE, { name, email })
            updateUserFields(res.data)
            toast.success('Profile updated')
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update profile')
        } finally {
            setSaving(false)
        }
    }

    return (
        <SettingsCard title="Profile" description="Update your name and email address.">
            <form onSubmit={handleSave} className="space-y-1">
                <Input label="Full Name" value={name} onChange={({ target }) => setName(target.value)} placeholder="Your name" />
                <Input label="Email" type="email" value={email} onChange={({ target }) => setEmail(target.value)} placeholder="you@example.com" />
                <button
                    type="submit"
                    disabled={!dirty || saving}
                    className="mt-2 flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100"
                >
                    {saving && <Loader2 size={14} className="animate-spin" />}
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </form>
        </SettingsCard>
    )
}

const PasswordSection = () => {
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [saving, setSaving] = useState(false)

    const handleSave = async (e) => {
        e.preventDefault()
        if (!currentPassword || !newPassword) { toast.error('Fill in both password fields'); return }
        if (newPassword.length < 6) { toast.error('New password must be at least 6 characters'); return }
        if (newPassword !== confirmPassword) { toast.error("New passwords don't match"); return }

        setSaving(true)
        try {
            await axiosInstance.put(API_PATHS.AUTH.CHANGE_PASSWORD, { currentPassword, newPassword })
            toast.success('Password updated')
            setCurrentPassword('')
            setNewPassword('')
            setConfirmPassword('')
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update password')
        } finally {
            setSaving(false)
        }
    }

    return (
        <SettingsCard title="Password" description="Change your account password.">
            <form onSubmit={handleSave} className="space-y-1">
                <Input label="Current Password" type="password" value={currentPassword} onChange={({ target }) => setCurrentPassword(target.value)} placeholder="••••••••" />
                <Input label="New Password" type="password" value={newPassword} onChange={({ target }) => setNewPassword(target.value)} placeholder="Min 6 characters" />
                <Input label="Confirm New Password" type="password" value={confirmPassword} onChange={({ target }) => setConfirmPassword(target.value)} placeholder="Re-enter new password" />
                <button
                    type="submit"
                    disabled={saving}
                    className="mt-2 flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100"
                >
                    {saving && <Loader2 size={14} className="animate-spin" />}
                    {saving ? 'Updating...' : 'Update Password'}
                </button>
            </form>
        </SettingsCard>
    )
}

const DELETE_PHRASE = 'DELETE MY ACCOUNT'

const DangerZone = () => {
    const { clearUser } = useContext(UserContext)
    const navigate = useNavigate()
    const [confirmText, setConfirmText] = useState('')
    const [deleting, setDeleting] = useState(false)

    const canDelete = confirmText.trim() === DELETE_PHRASE

    const handleDelete = async () => {
        if (!canDelete) return
        setDeleting(true)
        try {
            await axiosInstance.delete(API_PATHS.AUTH.DELETE_ACCOUNT)
            toast.success('Account deleted')
            localStorage.clear()
            clearUser()
            navigate('/')
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete account')
            setDeleting(false)
        }
    }

    return (
        <SettingsCard
            title="Danger Zone"
            description="Permanently delete your account and every resume you own. This cannot be undone."
            danger
        >
            <div className="flex items-start gap-2 mb-4 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-xl p-3">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <span>All of your resumes, thumbnails, and uploaded images will be permanently deleted along with your account.</span>
            </div>
            <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-2">
                Type <span className="font-mono text-red-600 dark:text-red-400">{DELETE_PHRASE}</span> to confirm
            </label>
            <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={DELETE_PHRASE}
                className="w-full mb-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 outline-none focus:border-red-400 transition-all text-gray-800 dark:text-gray-100"
            />
            <button
                type="button"
                disabled={!canDelete || deleting}
                onClick={handleDelete}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-all disabled:opacity-40 disabled:hover:bg-red-600"
            >
                {deleting && <Loader2 size={14} className="animate-spin" />}
                {deleting ? 'Deleting...' : 'Delete My Account Permanently'}
            </button>
        </SettingsCard>
    )
}

const Settings = () => {
    const { isDark, toggleTheme } = useTheme()

    return (
        <DashboardLayout>
            <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center">
                        <SettingsIcon size={22} className="text-violet-600 dark:text-violet-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 dark:text-white">Settings</h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Manage your account preferences.</p>
                    </div>
                </div>

                <SettingsCard title="Appearance" description="Choose how ResuMate looks on your device.">
                    <button
                        type="button"
                        onClick={toggleTheme}
                        className="px-4 py-2 text-sm font-bold rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                    >
                        Switch to {isDark ? "Light" : "Dark"} Mode
                    </button>
                </SettingsCard>

                <ProfileSection />
                <PasswordSection />
                <DangerZone />
            </div>
        </DashboardLayout>
    )
}

export default Settings