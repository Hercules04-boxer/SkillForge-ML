import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Trash2, Edit3, X, Save, Shield, Search } from 'lucide-react'
import './AdminDashboard.css'

export default function AdminDashboard() {
  const [users, setUsers] = useState([])
  const [totalUsers, setTotalUsers] = useState(0)
  const [loading, setLoading] = useState(true)
  const [editingUser, setEditingUser] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [searchQuery, setSearchQuery] = useState('')

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users', { credentials: 'include' })
      const data = await res.json()
      if (data.users) {
        setUsers(data.users)
        setTotalUsers(data.total_users)
      }
    } catch (err) {
      console.error('Failed to fetch users:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])

  const handleDelete = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      if (res.ok) fetchUsers()
    } catch (err) {
      console.error('Delete error:', err)
    }
  }

  const handleEdit = (user) => {
    setEditingUser(user.id)
    setEditForm({ name: user.name, phone: user.phone || '', email: user.email, background: user.background || '', password: '' })
  }

  const handleSave = async () => {
    try {
      const res = await fetch(`/api/admin/users/${editingUser}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(editForm)
      })
      if (res.ok) {
        setEditingUser(null)
        fetchUsers()
      } else {
        const errorData = await res.json()
        alert('Could not save changes: ' + errorData.error)
      }
    } catch (err) {
      console.error('Update error:', err)
    }
  }

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="admin-page">
      <div className="admin-container page-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="admin-header">
            <div>
              <h1><Shield size={24} /> Admin Dashboard</h1>
              <p>Manage users and system settings</p>
            </div>
            <div className="admin-stat-card">
              <Users size={20} />
              <div>
                <span className="admin-stat-value">{totalUsers}</span>
                <span className="admin-stat-label">Total Users</span>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="admin-search">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="input-field"
              placeholder="Search users by name or email..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '40px' }}
            />
          </div>

          {/* Users Table */}
          <div className="admin-table-wrapper glass-card">
            {loading ? (
              <div className="flex-center" style={{ padding: '40px' }}>
                <div style={{
                  width: 32, height: 32,
                  border: '3px solid var(--border-subtle)',
                  borderTopColor: 'var(--accent-blue)',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }} />
              </div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Sl.No.</th>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Background</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((user, i) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      {editingUser === user.id ? (
                        <>
                          <td>{i + 1}</td>
                          <td>{user.id}</td>
                          <td>
                            <input className="input-field table-input" value={editForm.name}
                              onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                          </td>
                          <td>
                            <input className="input-field table-input" value={editForm.email}
                              onChange={e => setEditForm({ ...editForm, email: e.target.value })} />
                          </td>
                          <td>
                            <input className="input-field table-input" value={editForm.phone}
                              onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
                          </td>
                          <td>
                            <input className="input-field table-input" value={editForm.background}
                              onChange={e => setEditForm({ ...editForm, background: e.target.value })} />
                          </td>
                          <td>
                            <div className="action-btns">
                              <button className="btn btn-icon btn-success" onClick={handleSave} title="Save">
                                <Save size={14} />
                              </button>
                              <button className="btn btn-icon btn-ghost" onClick={() => setEditingUser(null)} title="Cancel">
                                <X size={14} />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td>{i + 1}</td>
                          <td>{user.id}</td>
                          <td className="user-name-cell">{user.name}</td>
                          <td className="user-email-cell">{user.email}</td>
                          <td>{user.phone || '—'}</td>
                          <td>
                            {user.background && (
                              <span className="bg-badge">{user.background}</span>
                            )}
                          </td>
                          <td>
                            <div className="action-btns">
                              <button className="btn btn-icon btn-secondary" onClick={() => handleEdit(user)} title="Edit">
                                <Edit3 size={14} />
                              </button>
                              <button className="btn btn-icon btn-danger" onClick={() => handleDelete(user.id)} title="Delete">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            )}

            {!loading && filtered.length === 0 && (
              <div className="empty-state">
                <Users size={32} />
                <p>No users found</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
