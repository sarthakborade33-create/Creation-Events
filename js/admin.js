/**
 * CREATION EVENTS - SECURE ADMIN CONTROLLER
 * Handles Firebase Authentication, Firestore queries, real-time data inspection,
 * filtering, searching, detail modals, and CSV export.
 * 
 * Completely decoupled from the public website scripts.
 */

(function () {
  'use strict';

  // State Management
  let allSubmissions = [];
  let currentTab = 'all'; // 'all' | 'bookings' | 'contactMessages'
  let currentUser = null;
  let dbInstance = null;

  // DOM Elements - Auth & Screens
  const loginScreen = document.getElementById('admin-login-screen');
  const dashboardScreen = document.getElementById('admin-dashboard-screen');
  const loginForm = document.getElementById('admin-login-form');
  const loginEmail = document.getElementById('login-email');
  const loginPassword = document.getElementById('login-password');
  const loginBtn = document.getElementById('login-submit-btn');
  const loginStatus = document.getElementById('login-status-box');
  const togglePasswordBtn = document.getElementById('toggle-password-visibility');
  const logoutBtn = document.getElementById('btn-logout');
  const userEmailDisplay = document.getElementById('admin-user-email');

  // DOM Elements - Dashboard Controls
  const submissionsTbody = document.getElementById('submissions-tbody');
  const searchInput = document.getElementById('search-submissions');
  const eventFilter = document.getElementById('filter-event-type');
  const sortFilter = document.getElementById('filter-sort');
  const refreshBtn = document.getElementById('btn-refresh-data');
  const exportCsvBtn = document.getElementById('btn-export-csv');
  const alertContainer = document.getElementById('admin-alert-container');

  // KPI Counter Elements
  const countTotal = document.getElementById('kpi-total-submissions');
  const countBookings = document.getElementById('kpi-bookings-count');
  const countMessages = document.getElementById('kpi-messages-count');
  const countToday = document.getElementById('kpi-today-count');

  // Tab Count Elements
  const tabCountAll = document.getElementById('tab-count-all');
  const tabCountBookings = document.getElementById('tab-count-bookings');
  const tabCountMessages = document.getElementById('tab-count-messages');

  // Modal Elements
  const detailsModal = document.getElementById('submission-details-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalCustomerName = document.getElementById('modal-customer-name');
  const modalCustomerPhone = document.getElementById('modal-customer-phone');
  const modalCustomerEmail = document.getElementById('modal-customer-email');
  const modalEventType = document.getElementById('modal-event-type');
  const modalEventDate = document.getElementById('modal-event-date');
  const modalCollection = document.getElementById('modal-collection');
  const modalCreatedAt = document.getElementById('modal-created-at');
  const modalMessageText = document.getElementById('modal-message-text');
  const modalBtnCall = document.getElementById('modal-btn-call');
  const modalBtnWhatsApp = document.getElementById('modal-btn-whatsapp');
  const modalBtnEmail = document.getElementById('modal-btn-email');

  // --------------------------------------------------------------------------
  // 1. INITIALIZATION & AUTH STATE LISTENER
  // --------------------------------------------------------------------------
  function initAdmin() {
    setupEventListeners();

    // Check if Firebase Compat is present
    if (typeof firebase === 'undefined') {
      showLoginError('Firebase SDK could not be loaded. Please check your internet connection.');
      return;
    }

    // Initialize Auth Listener
    try {
      firebase.auth().onAuthStateChanged((user) => {
        currentUser = user;
        if (user) {
          onUserAuthenticated(user);
        } else {
          onUserSignedOut();
        }
      });
    } catch (err) {
      console.error('Firebase Auth Init Error:', err);
      showLoginError('Firebase Auth error: ' + (err.message || err));
    }
  }

  // --------------------------------------------------------------------------
  // 2. AUTHENTICATION HANDLERS
  // --------------------------------------------------------------------------
  function setupEventListeners() {
    // Password visibility toggle
    if (togglePasswordBtn && loginPassword) {
      togglePasswordBtn.addEventListener('click', () => {
        const isPassword = loginPassword.type === 'password';
        loginPassword.type = isPassword ? 'text' : 'password';
        const icon = togglePasswordBtn.querySelector('i');
        if (icon) {
          icon.className = isPassword ? 'fas fa-eye-slash' : 'fas fa-eye';
        }
      });
    }

    // Login Form Submit
    if (loginForm) {
      loginForm.addEventListener('submit', handleLogin);
    }

    // Logout
    if (logoutBtn) {
      logoutBtn.addEventListener('click', handleLogout);
    }

    // Tab buttons
    document.querySelectorAll('.tab-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
        const targetBtn = e.currentTarget;
        targetBtn.classList.add('active');
        currentTab = targetBtn.getAttribute('data-tab') || 'all';
        renderSubmissions();
      });
    });

    // Search and filter inputs
    if (searchInput) {
      searchInput.addEventListener('input', debounce(renderSubmissions, 200));
    }
    if (eventFilter) {
      eventFilter.addEventListener('change', renderSubmissions);
    }
    if (sortFilter) {
      sortFilter.addEventListener('change', renderSubmissions);
    }

    // Refresh button
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        refreshBtn.classList.add('rotating');
        fetchSubmissions().finally(() => {
          setTimeout(() => refreshBtn.classList.remove('rotating'), 600);
        });
      });
    }

    // Export CSV button
    if (exportCsvBtn) {
      exportCsvBtn.addEventListener('click', exportToCsv);
    }

    // Modal close events
    if (modalCloseBtn) {
      modalCloseBtn.addEventListener('click', closeModal);
    }
    if (detailsModal) {
      detailsModal.addEventListener('click', (e) => {
        if (e.target === detailsModal) closeModal();
      });
    }
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && detailsModal && detailsModal.classList.contains('active')) {
        closeModal();
      }
    });
  }

  async function handleLogin(e) {
    e.preventDefault();
    hideLoginError();

    const email = loginEmail.value.trim();
    const password = loginPassword.value;

    if (!email || !password) {
      showLoginError('Please enter both your admin email and password.');
      return;
    }

    setLoginLoading(true);

    try {
      await firebase.auth().signInWithEmailAndPassword(email, password);
      // Auth state listener handles the UI transition
    } catch (err) {
      console.error('Sign-in failure:', err);
      let userFriendlyMessage = 'Login failed. Please check your credentials.';

      switch (err.code) {
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
        case 'auth/user-not-found':
          userFriendlyMessage = 'Invalid email or password. Only authorized admin accounts can log in.';
          break;
        case 'auth/invalid-email':
          userFriendlyMessage = 'Please enter a valid email address format.';
          break;
        case 'auth/user-disabled':
          userFriendlyMessage = 'This admin account has been disabled. Contact the system administrator.';
          break;
        case 'auth/too-many-requests':
          userFriendlyMessage = 'Too many failed login attempts. Access is temporarily blocked for security. Please try again later.';
          break;
        case 'auth/configuration-not-found':
          userFriendlyMessage = 'Firebase Authentication is not yet enabled in your Firebase Console. Go to Build > Authentication > Sign-in method, and enable "Email/Password".';
          break;
        case 'auth/network-request-failed':
          userFriendlyMessage = 'Network connection error. Please check your internet connection.';
          break;
        default:
          userFriendlyMessage = err.message || userFriendlyMessage;
      }

      showLoginError(userFriendlyMessage);
      setLoginLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await firebase.auth().signOut();
    } catch (err) {
      console.error('Sign out error:', err);
      alert('Error during logout: ' + (err.message || err));
    }
  }

  function onUserAuthenticated(user) {
    if (loginScreen) loginScreen.style.display = 'none';
    if (dashboardScreen) dashboardScreen.style.display = 'flex';
    if (userEmailDisplay) userEmailDisplay.textContent = user.email || 'Admin';

    // Get Firestore instance
    dbInstance = window.firebaseModule?.db || firebase.firestore();

    fetchSubmissions();
  }

  function onUserSignedOut() {
    currentUser = null;
    allSubmissions = [];
    if (loginScreen) loginScreen.style.display = 'flex';
    if (dashboardScreen) dashboardScreen.style.display = 'none';
    if (loginPassword) loginPassword.value = '';
    setLoginLoading(false);
    clearAlert();
  }

  function setLoginLoading(isLoading) {
    if (!loginBtn) return;
    if (isLoading) {
      loginBtn.disabled = true;
      loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Authenticating...';
    } else {
      loginBtn.disabled = false;
      loginBtn.innerHTML = '<i class="fas fa-lock"></i> Sign In to Dashboard';
    }
  }

  function showLoginError(msg) {
    if (!loginStatus) return;
    loginStatus.className = 'login-status-box error';
    loginStatus.innerHTML = `<i class="fas fa-exclamation-triangle" style="margin-top:2px;"></i> <div>${escapeHtml(msg)}</div>`;
    loginStatus.style.display = 'flex';
  }

  function hideLoginError() {
    if (!loginStatus) return;
    loginStatus.style.display = 'none';
    loginStatus.innerHTML = '';
  }

  // --------------------------------------------------------------------------
  // 3. FIRESTORE DATA RETRIEVAL (REAL CUSTOMER SUBMISSIONS)
  // --------------------------------------------------------------------------
  async function fetchSubmissions() {
    renderLoadingSkeleton();
    clearAlert();

    if (!dbInstance) {
      dbInstance = window.firebaseModule?.db || firebase.firestore();
    }

    try {
      // Query both collections in parallel
      const [bookingsSnap, contactSnap] = await Promise.all([
        dbInstance.collection('bookings').get().catch(handleQueryError('bookings')),
        dbInstance.collection('contactMessages').get().catch(handleQueryError('contactMessages'))
      ]);

      const items = [];

      // Process Bookings
      if (bookingsSnap && bookingsSnap.docs) {
        bookingsSnap.forEach((doc) => {
          items.push(normalizeDoc(doc, 'bookings'));
        });
      }

      // Process Contact Messages
      if (contactSnap && contactSnap.docs) {
        contactSnap.forEach((doc) => {
          items.push(normalizeDoc(doc, 'contactMessages'));
        });
      }

      // Sort by newest first
      items.sort((a, b) => b.timestampMs - a.timestampMs);

      allSubmissions = items;
      updateKpis(items);
      renderSubmissions();
    } catch (err) {
      console.error('Error fetching submissions:', err);
      showAlert('danger', `Unable to load submissions: ${err.message || 'Permission denied or Firestore error.'}. Ensure your Firestore Security Rules permit authenticated reads.`);
      renderEmptyState('Failed to load submissions from Firestore.');
    }
  }

  function handleQueryError(collectionName) {
    return (err) => {
      console.warn(`Query error on collection "${collectionName}":`, err);
      if (err.code === 'permission-denied') {
        showAlert('warning', `Access to collection "${collectionName}" was denied. Please publish the updated firestore.rules to Firebase to allow authenticated admin reads.`);
      }
      return { docs: [] };
    };
  }

  function normalizeDoc(doc, collectionName) {
    const data = doc.data() || {};
    let timestampMs = 0;
    let formattedDate = 'N/A';

    if (data.createdAt) {
      if (typeof data.createdAt.toDate === 'function') {
        const d = data.createdAt.toDate();
        timestampMs = d.getTime();
        formattedDate = formatDateTime(d);
      } else if (typeof data.createdAt.seconds === 'number') {
        const d = new Date(data.createdAt.seconds * 1000);
        timestampMs = d.getTime();
        formattedDate = formatDateTime(d);
      } else if (typeof data.createdAt === 'string') {
        const d = new Date(data.createdAt);
        if (!isNaN(d.getTime())) {
          timestampMs = d.getTime();
          formattedDate = formatDateTime(d);
        }
      }
    }

    return {
      id: doc.id,
      collection: collectionName,
      name: data.name || 'Anonymous',
      phone: data.phone || 'N/A',
      email: data.email || 'N/A',
      eventType: data.eventType || 'General Inquiry',
      eventDate: data.eventDate || '',
      message: data.message || '',
      createdAt: data.createdAt,
      timestampMs,
      formattedDate
    };
  }

  // --------------------------------------------------------------------------
  // 4. RENDERING & FILTERING
  // --------------------------------------------------------------------------
  function getFilteredSubmissions() {
    let list = [...allSubmissions];

    // Filter by tab
    if (currentTab === 'bookings') {
      list = list.filter((item) => item.collection === 'bookings');
    } else if (currentTab === 'contactMessages') {
      list = list.filter((item) => item.collection === 'contactMessages');
    }

    // Filter by Event Type dropdown
    const selectedEvent = eventFilter ? eventFilter.value : '';
    if (selectedEvent) {
      list = list.filter((item) => {
        const ev = (item.eventType || '').toLowerCase();
        return ev.includes(selectedEvent.toLowerCase());
      });
    }

    // Filter by search query
    const query = (searchInput ? searchInput.value : '').trim().toLowerCase();
    if (query) {
      list = list.filter((item) => {
        return (
          item.name.toLowerCase().includes(query) ||
          item.email.toLowerCase().includes(query) ||
          item.phone.toLowerCase().includes(query) ||
          item.eventType.toLowerCase().includes(query) ||
          item.message.toLowerCase().includes(query) ||
          (item.eventDate && item.eventDate.toLowerCase().includes(query))
        );
      });
    }

    // Sorting
    const sortVal = sortFilter ? sortFilter.value : 'newest';
    if (sortVal === 'oldest') {
      list.sort((a, b) => a.timestampMs - b.timestampMs);
    } else {
      list.sort((a, b) => b.timestampMs - a.timestampMs);
    }

    return list;
  }

  function renderSubmissions() {
    const filtered = getFilteredSubmissions();

    if (!submissionsTbody) return;

    if (filtered.length === 0) {
      renderEmptyState('No customer submissions match your current filters.');
      return;
    }

    let html = '';
    filtered.forEach((item) => {
      const cleanPhone = (item.phone || '').replace(/\D/g, '');
      const whatsAppPhone = cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone;
      const waText = encodeURIComponent(`Hello ${item.name}, thank you for contacting Creation Events regarding your ${item.eventType} inquiry.`);
      const collectionBadge = item.collection === 'bookings'
        ? '<span class="badge-collection booking"><i class="fas fa-calendar-check"></i> Booking</span>'
        : '<span class="badge-collection contact"><i class="fas fa-envelope"></i> Contact</span>';

      html += `
        <tr data-id="${escapeHtml(item.id)}" data-collection="${escapeHtml(item.collection)}">
          <td>
            <div style="font-weight: 500; color: var(--text-primary);">${item.formattedDate}</div>
            <div style="margin-top: 4px;">${collectionBadge}</div>
          </td>
          <td class="customer-cell">
            <span class="customer-name">${escapeHtml(item.name)}</span>
            <div class="customer-meta">
              <span><i class="fas fa-phone-alt"></i> ${escapeHtml(item.phone)}</span>
            </div>
          </td>
          <td>
            <div style="margin-bottom: 4px; font-size: 0.85rem;">
              <a href="mailto:${escapeHtml(item.email)}" style="color: var(--text-secondary);"><i class="fas fa-envelope"></i> ${escapeHtml(item.email)}</a>
            </div>
            <div class="contact-quicklinks">
              ${item.phone && item.phone !== 'N/A' ? `
                <a href="tel:${escapeHtml(item.phone)}" class="btn-icon-link" title="Call Customer">
                  <i class="fas fa-phone"></i>
                </a>
                <a href="https://wa.me/${whatsAppPhone}?text=${waText}" target="_blank" rel="noopener noreferrer" class="btn-icon-link whatsapp" title="Chat on WhatsApp">
                  <i class="fab fa-whatsapp"></i>
                </a>
              ` : ''}
              ${item.email && item.email !== 'N/A' ? `
                <a href="mailto:${escapeHtml(item.email)}" class="btn-icon-link" title="Send Email">
                  <i class="fas fa-paper-plane"></i>
                </a>
              ` : ''}
            </div>
          </td>
          <td>
            <span class="badge-event">${escapeHtml(item.eventType)}</span>
            ${item.eventDate ? `<div style="font-size: 0.78rem; color: var(--gold-light); margin-top: 4px;"><i class="fas fa-calendar-day"></i> ${escapeHtml(item.eventDate)}</div>` : ''}
          </td>
          <td>
            <div class="message-preview" title="Click to view full message" onclick="window.adminApp.openDetails('${escapeHtml(item.id)}')">
              ${item.message ? escapeHtml(item.message) : '<em style="color:var(--text-muted)">No message provided</em>'}
            </div>
          </td>
          <td>
            <div class="table-actions">
              <button type="button" class="btn-table-action" onclick="window.adminApp.openDetails('${escapeHtml(item.id)}')">
                <i class="fas fa-eye"></i> Details
              </button>
              <button type="button" class="btn-table-action delete" title="Delete submission" onclick="window.adminApp.confirmDelete('${escapeHtml(item.id)}', '${escapeHtml(item.collection)}')">
                <i class="fas fa-trash-alt"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    });

    submissionsTbody.innerHTML = html;
  }

  function renderLoadingSkeleton() {
    if (!submissionsTbody) return;
    let html = '';
    for (let i = 0; i < 5; i++) {
      html += `
        <tr class="skeleton-row">
          <td><div class="skeleton-bar" style="width: 110px;"></div></td>
          <td><div class="skeleton-bar" style="width: 140px;"></div></td>
          <td><div class="skeleton-bar" style="width: 160px;"></div></td>
          <td><div class="skeleton-bar" style="width: 90px;"></div></td>
          <td><div class="skeleton-bar" style="width: 220px;"></div></td>
          <td><div class="skeleton-bar" style="width: 70px;"></div></td>
        </tr>
      `;
    }
    submissionsTbody.innerHTML = html;
  }

  function renderEmptyState(message) {
    if (!submissionsTbody) return;
    submissionsTbody.innerHTML = `
      <tr>
        <td colspan="6">
          <div class="empty-state">
            <div class="empty-state-icon">
              <i class="fas fa-inbox"></i>
            </div>
            <h3>No Submissions Found</h3>
            <p>${escapeHtml(message)}</p>
          </div>
        </td>
      </tr>
    `;
  }

  // --------------------------------------------------------------------------
  // 5. STATS & KPIS
  // --------------------------------------------------------------------------
  function updateKpis(items) {
    const total = items.length;
    const bookings = items.filter((x) => x.collection === 'bookings').length;
    const messages = items.filter((x) => x.collection === 'contactMessages').length;

    // Today's inquiries
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayCount = items.filter((x) => x.timestampMs >= startOfToday.getTime()).length;

    if (countTotal) countTotal.textContent = total;
    if (countBookings) countBookings.textContent = bookings;
    if (countMessages) countMessages.textContent = messages;
    if (countToday) countToday.textContent = todayCount;

    if (tabCountAll) tabCountAll.textContent = total;
    if (tabCountBookings) tabCountBookings.textContent = bookings;
    if (tabCountMessages) tabCountMessages.textContent = messages;
  }

  // --------------------------------------------------------------------------
  // 6. DETAILS MODAL & ACTIONS
  // --------------------------------------------------------------------------
  function openDetails(itemId) {
    const item = allSubmissions.find((x) => x.id === itemId);
    if (!item || !detailsModal) return;

    if (modalCustomerName) modalCustomerName.textContent = item.name;
    if (modalCustomerPhone) modalCustomerPhone.textContent = item.phone || 'N/A';
    if (modalCustomerEmail) modalCustomerEmail.textContent = item.email || 'N/A';
    if (modalEventType) modalEventType.textContent = item.eventType || 'General Inquiry';
    if (modalEventDate) modalEventDate.textContent = item.eventDate ? item.eventDate : 'Not specified';
    if (modalCollection) {
      modalCollection.textContent = item.collection === 'bookings' ? 'Bookings Collection' : 'Contact Messages Collection';
    }
    if (modalCreatedAt) modalCreatedAt.textContent = item.formattedDate;
    if (modalMessageText) {
      modalMessageText.textContent = item.message ? item.message : 'No detailed message provided by the customer.';
    }

    // Set Quick Action buttons
    const cleanPhone = (item.phone || '').replace(/\D/g, '');
    const whatsAppPhone = cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone;
    const waText = encodeURIComponent(`Hello ${item.name}, thank you for contacting Creation Events regarding your ${item.eventType} inquiry.`);

    if (modalBtnCall) {
      modalBtnCall.href = item.phone && item.phone !== 'N/A' ? `tel:${item.phone}` : '#';
      modalBtnCall.style.display = item.phone && item.phone !== 'N/A' ? 'inline-flex' : 'none';
    }
    if (modalBtnWhatsApp) {
      modalBtnWhatsApp.href = cleanPhone ? `https://wa.me/${whatsAppPhone}?text=${waText}` : '#';
      modalBtnWhatsApp.style.display = cleanPhone ? 'inline-flex' : 'none';
    }
    if (modalBtnEmail) {
      modalBtnEmail.href = item.email && item.email !== 'N/A' ? `mailto:${item.email}` : '#';
      modalBtnEmail.style.display = item.email && item.email !== 'N/A' ? 'inline-flex' : 'none';
    }

    detailsModal.classList.add('active');
  }

  function closeModal() {
    if (detailsModal) detailsModal.classList.remove('active');
  }

  async function confirmDelete(itemId, collectionName) {
    const confirmMsg = `Are you sure you want to delete this submission from ${collectionName}? This action cannot be undone.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      if (!dbInstance) {
        dbInstance = window.firebaseModule?.db || firebase.firestore();
      }
      await dbInstance.collection(collectionName).doc(itemId).delete();
      // Remove from memory
      allSubmissions = allSubmissions.filter((x) => !(x.id === itemId && x.collection === collectionName));
      updateKpis(allSubmissions);
      renderSubmissions();
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete submission: ' + (err.message || err));
    }
  }

  // --------------------------------------------------------------------------
  // 7. CSV EXPORT
  // --------------------------------------------------------------------------
  function exportToCsv() {
    const list = getFilteredSubmissions();
    if (list.length === 0) {
      alert('No submissions available to export with current filters.');
      return;
    }

    const headers = ['Submission Date', 'Collection', 'Name', 'Phone', 'Email', 'Event Type', 'Event Date', 'Message'];
    const rows = list.map((item) => [
      item.formattedDate,
      item.collection,
      item.name,
      item.phone,
      item.email,
      item.eventType,
      item.eventDate || '',
      item.message ? item.message.replace(/\r?\n/g, ' ') : ''
    ]);

    const csvContent = [
      headers.map(escapeCsvField).join(','),
      ...rows.map((r) => r.map(escapeCsvField).join(','))
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `creation_events_submissions_${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function escapeCsvField(field) {
    if (field === null || field === undefined) return '""';
    const stringField = String(field);
    if (stringField.includes('"') || stringField.includes(',') || stringField.includes('\n')) {
      return `"${stringField.replace(/"/g, '""')}"`;
    }
    return `"${stringField}"`;
  }

  // --------------------------------------------------------------------------
  // 8. HELPERS & UTILITIES
  // --------------------------------------------------------------------------
  function formatDateTime(d) {
    if (!d || isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }) + ' ' + d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function showAlert(type, message) {
    if (!alertContainer) return;
    alertContainer.innerHTML = `
      <div class="admin-alert ${type}">
        <div style="display:flex; align-items:center; gap:0.6rem;">
          <i class="fas ${type === 'danger' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
          <span>${escapeHtml(message)}</span>
        </div>
        <button type="button" style="background:none; border:none; color:inherit; cursor:pointer;" onclick="this.parentElement.remove()">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;
  }

  function clearAlert() {
    if (alertContainer) alertContainer.innerHTML = '';
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function debounce(fn, delay) {
    let timer = null;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  // Expose global methods for table action buttons
  window.adminApp = {
    openDetails,
    confirmDelete,
    closeModal
  };

  // Launch on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdmin);
  } else {
    initAdmin();
  }
})();
