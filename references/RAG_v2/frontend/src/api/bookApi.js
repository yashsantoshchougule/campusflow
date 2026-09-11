const API = import.meta.env.VITE_API_URL;
const getToken = () => localStorage.getItem("access_token");

// studyScreen
export async function getBooks() {
  const response = await fetch(`${API}/books/`, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Failed to fetch books");
  }

  return data.books || [];
}

export async function uploadBook(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API}/books/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Upload failed");
  }

  return data;
}

export async function deleteBook(bookId) {
  const response = await fetch(`${API}/books/${bookId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Delete failed");
  }

  return data;
}

export async function getBook(bookId) {
  const response = await fetch(`${API}/books/${bookId}`, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to load book");
  }

  return await response.json();
}

// bookReader
export async function updateProgress(bookId, currentPage) {
  const response = await fetch(`${API}/books/${bookId}/progress`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      current_page: currentPage,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Failed to update progress");
  }

  return data;
}

export async function updateLastOpened(bookId) {
  const response = await fetch(`${API}/books/${bookId}/open`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Failed to update last opened");
  }

  return data;
}