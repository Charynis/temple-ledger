import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import TransactionModal from './TransactionModal'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPen, faTrash } from "@fortawesome/free-solid-svg-icons";

export default function History() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [modalMode, setModalMode] = useState('income')
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('date-desc')

  async function load() {
    setLoading(true)
    const { data } = await supabase.rpc('get_all_transactions')
    if (!data) {
      const inc = await supabase.from('income').select('id,date,source,amount,notes')
      const exp = await supabase.from('expenses').select('id,date,category,amount,notes')
      const merged = []
      if (inc.data) merged.push(...inc.data.map(r => ({ ...r, type: 'income', category: r.source })))
      if (exp.data) merged.push(...exp.data.map(r => ({ ...r, type: 'expense' })))
      merged.sort((a, b) => new Date(b.date) - new Date(a.date))
      setItems(merged)
    } else {
      setItems(data)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleDelete(it) {
    if (!confirm('Delete this transaction?')) return
    const table = it.type === 'income' ? 'income' : 'expenses'
    const { error } = await supabase.from(table).delete().eq('id', it.id)
    if (error) return alert(error.message)
    load()
  }

  function startEdit(it) {
    setEditing(it)
    setModalMode(it.type)
  }

  // filter
  const filteredItems = items.filter(it => {
    if (filter === 'all') return true
    if (filter === 'income') return it.type === 'income'
    if (filter === 'expense') return it.type === 'expense'
    return true
  })

  // sort
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sort === 'date-asc') return new Date(a.date) - new Date(b.date)
    if (sort === 'date-desc') return new Date(b.date) - new Date(a.date)
    if (sort === 'amount-asc') return a.amount - b.amount
    if (sort === 'amount-desc') return b.amount - a.amount
    return 0
  })

  return (
    <div>
      <div className="bg-white p-4 rounded shadow">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h3 className="font-semibold">Transactions</h3>

          {/* Filter radio buttons */}
          <div className="flex gap-4">
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="radio"
                value="all"
                checked={filter === 'all'}
                onChange={(e) => setFilter(e.target.value)}
                className="accent-blue-600"
              />
              All
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="radio"
                value="income"
                checked={filter === 'income'}
                onChange={(e) => setFilter(e.target.value)}
                className="accent-green-600"
              />
              Income
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="radio"
                value="expense"
                checked={filter === 'expense'}
                onChange={(e) => setFilter(e.target.value)}
                className="accent-red-600"
              />
              Expenses
            </label>
          </div>
        </div>

        {/* Sort dropdown */}
        <div className="mb-4">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="border rounded px-2 py-1"
          >
            <option value="date-desc">Date (Newest First)</option>
            <option value="date-asc">Date (Oldest First)</option>
            <option value="amount-desc">Amount (High to Low)</option>
            <option value="amount-asc">Amount (Low to High)</option>
          </select>
        </div>

        {loading ? <p>Loading...</p> : (
          <>
            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2">Date</th>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>Notes</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedItems.map(it => (
                    <tr key={it.id} className="border-b">
                      <td className="py-2">{it.date}</td>
                      <td>{it.category}</td>
                      <td className={`${it.type === 'income' ? 'text-green-700' : 'text-red-700'}`}>
                        ₹{Number(it.amount).toFixed(2)}
                      </td>
                      <td>{it.notes}</td>
                      <td className="space-x-2">
                        <button
                          onClick={() => startEdit(it)}
                          className="px-2 py-1 rounded bg-yellow-400 text-white"
                          title="Edit"
                        >
                          <FontAwesomeIcon icon={faPen} />
                        </button>
                        <button
                          onClick={() => handleDelete(it)}
                          className="px-2 py-1 rounded bg-red-500 text-white"
                          title="Delete"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {sortedItems.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center py-4 text-gray-500">No transactions found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Layout */}
            <div className="sm:hidden flex flex-col gap-3">
              {sortedItems.map(it => (
                <div key={it.id} className="border rounded-lg p-3 shadow-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">{it.category}</span>
                    <span className={`${it.type === 'income' ? 'text-green-700' : 'text-red-700'} font-semibold`}>
                      ₹{Number(it.amount).toFixed(2)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">{it.date}</div>
                  {it.notes && <div className="mt-1 text-sm">{it.notes}</div>}
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => startEdit(it)}
                      className="flex-1 px-2 py-1 rounded bg-yellow-400 text-white"
                      title="Edit"
                    >
                      <FontAwesomeIcon icon={faPen} />
                    </button>
                    <button
                      onClick={() => handleDelete(it)}
                      className="flex-1 px-2 py-1 rounded bg-red-500 text-white"
                      title="Delete"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                </div>
              ))}
              {sortedItems.length === 0 && (
                <div className="text-center py-4 text-gray-500">No transactions found</div>
              )}
            </div>
          </>
        )}
      </div>

      {editing && (
        <TransactionModal
          mode={modalMode}
          editItem={editing}
          onClose={() => { setEditing(null); load(); }}
        />
      )}
    </div>
  )
}
