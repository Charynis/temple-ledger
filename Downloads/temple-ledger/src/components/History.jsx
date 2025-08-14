import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import TransactionModal from './TransactionModal'

export default function History(){
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [modalMode, setModalMode] = useState('income')

  async function load(){
    setLoading(true)
    const query = `select id, date, 'income' as type, source as category, amount, notes from income union all select id, date, 'expense' as type, category, amount, notes from expenses order by date desc`
    const { data, error } = await supabase.rpc('get_all_transactions')
    // If RPC isn't created, fallback to raw query via from SQL is not supported client-side; we'll use two queries
    if(!data){
      const inc = await supabase.from('income').select('id,date,source,amount,notes')
      const exp = await supabase.from('expenses').select('id,date,category,amount,notes')
      const merged = []
      if(inc.data) merged.push(...inc.data.map(r=>({ ...r, type:'income', category: r.source })))
      if(exp.data) merged.push(...exp.data.map(r=>({ ...r, type:'expense' })))
      merged.sort((a,b)=> new Date(b.date) - new Date(a.date))
      setItems(merged)
    } else {
      setItems(data)
    }
    setLoading(false)
  }

  useEffect(()=>{ load() }, [])

  async function handleDelete(it){
    if(!confirm('Delete this transaction?')) return
    const table = it.type === 'income' ? 'income' : 'expenses'
    const { error } = await supabase.from(table).delete().eq('id', it.id)
    if(error) return alert(error.message)
    load()
  }

  function startEdit(it){
    setEditing(it)
    setModalMode(it.type)
  }

  return (
    <div>
      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-semibold mb-2">All Transactions</h3>
        {loading ? <p>Loading...</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2">Date</th>
                  <th>Type</th>
                  <th>Category/Source</th>
                  <th>Amount</th>
                  <th>Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(it => (
                  <tr key={it.id} className="border-b">
                    <td className="py-2">{it.date}</td>
                    <td>{it.type}</td>
                    <td>{it.category}</td>
                    <td className={`${it.type==='income' ? 'text-green-700' : 'text-red-700'}`}>₹{Number(it.amount).toFixed(2)}</td>
                    <td>{it.notes}</td>
                    <td className="space-x-2">
                      <button onClick={()=>startEdit(it)} className="px-2 py-1 rounded bg-yellow-400">Edit</button>
                      <button onClick={()=>handleDelete(it)} className="px-2 py-1 rounded bg-red-500 text-white">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && <TransactionModal mode={modalMode} editItem={editing} onClose={()=>{ setEditing(null); load(); }} />}
    </div>
  )
}