import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import TransactionModal from './TransactionModal'

export default function Dashboard(){
  const [summary, setSummary] = useState({ total_income:0, total_expenses:0, balance:0 })
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState('income') // or 'expense'

  async function fetchSummary(){
    const { data, error } = await supabase.from('ledger_summary').select('*').single()
    if(data) setSummary(data)
  }

  useEffect(()=>{ fetchSummary();
    const incomeSub = supabase.channel('public:income').on('postgres_changes', { event: '*', schema: 'public', table: 'income' }, payload => fetchSummary()).subscribe()
    const expenseSub = supabase.channel('public:expenses').on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, payload => fetchSummary()).subscribe()
    return ()=>{ incomeSub.unsubscribe(); expenseSub.unsubscribe(); }
  }, [])

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div className="p-4 bg-white rounded shadow">
          <div className="text-sm text-gray-500">Total Income</div>
          <div className="text-2xl font-semibold">₹{Number(summary.total_income).toFixed(2)}</div>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <div className="text-sm text-gray-500">Total Expenses</div>
          <div className="text-2xl font-semibold">₹{Number(summary.total_expenses).toFixed(2)}</div>
        </div>
        <div className={`p-4 rounded shadow ${summary.balance >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className="text-sm text-gray-500">Balance</div>
          <div className={`text-2xl font-semibold ${summary.balance >= 0 ? 'text-green-700' : 'text-red-700'}`}>₹{Number(summary.balance).toFixed(2)}</div>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <button onClick={()=>{ setModalMode('income'); setShowModal(true);}} className="px-4 py-2 rounded bg-green-600 text-white">Add Income</button>
        <button onClick={()=>{ setModalMode('expense'); setShowModal(true);}} className="px-4 py-2 rounded bg-red-600 text-white">Add Expense</button>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-semibold mb-2">Recent Transactions</h3>
        {/* show 8 recent combined transactions */}
        <RecentList />
      </div>

      {showModal && <TransactionModal mode={modalMode} onClose={()=>{ setShowModal(false); fetchSummary(); }} />}
    </div>
  )
}

function RecentList(){
  const [items, setItems] = useState([])
  useEffect(()=>{
    async function load(){
      const { data, error } = await supabase.rpc('get_recent_transactions', { limit_in: 8 })
      if(data) setItems(data)
    }
    load()
  }, [])

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b">
            <th className="py-2">Date</th>
            <th>Type</th>
            <th>Category</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map(i=> (
            <tr key={i.id} className="border-b">
              <td className="py-2">{i.date}</td>
              <td>{i.type}</td>
              <td>{i.category}</td>
              <td className={`${i.type==='income' ? 'text-green-700' : 'text-red-700'}`}>₹{Number(i.amount).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}