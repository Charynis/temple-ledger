import React, { useState } from 'react'
import { supabase } from '../supabaseClient'
import dayjs from 'dayjs'

export default function TransactionModal({ mode='income', onClose, editItem=null }){
  const isIncome = mode==='income'
  const [date, setDate] = useState(editItem ? editItem.date : dayjs().format('YYYY-MM-DD'))
  const [sourceOrCategory, setSourceOrCategory] = useState(editItem ? editItem.category : '')
  const [amount, setAmount] = useState(editItem ? editItem.amount : '')
  const [notes, setNotes] = useState(editItem ? editItem.notes : '')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e){
    e.preventDefault(); setLoading(true)
    const table = isIncome ? 'income' : 'expenses'
    try{
      if(editItem){
        const { error } = await supabase.from(table).update({ date, amount, notes, ...(isIncome ? { source: sourceOrCategory } : { category: sourceOrCategory }) }).eq('id', editItem.id)
        if(error) throw error
      } else {
        const user = supabase.auth.getUser().then(r=>r?.data?.user)
        const uid = (await supabase.auth.getSession()).data.session.user.id
        const payload = { date, amount, notes, user_id: uid, ...(isIncome ? { source: sourceOrCategory } : { category: sourceOrCategory }) }
        const { error } = await supabase.from(table).insert(payload)
        if(error) throw error
      }
      onClose()
    } catch(err){
      console.error(err)
      alert(err.message || 'Error')
    } finally{ setLoading(false) }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center modal-backdrop">
      <div className="bg-white w-full max-w-md p-4 rounded shadow z-50">
        <h3 className="font-semibold mb-2">{editItem ? 'Edit' : 'Add'} {isIncome ? 'Income' : 'Expense'}</h3>
        <form onSubmit={handleSubmit} className="space-y-2">
          <input type="date" className="w-full p-2 border rounded" value={date} onChange={e=>setDate(e.target.value)} required />
          <input type="text" className="w-full p-2 border rounded" placeholder={isIncome? 'Source (eg Donation)' : 'Category (eg Maintenance)'} value={sourceOrCategory} onChange={e=>setSourceOrCategory(e.target.value)} required />
          <input type="number" step="0.01" className="w-full p-2 border rounded" placeholder="Amount" value={amount} onChange={e=>setAmount(e.target.value)} required />
          <textarea className="w-full p-2 border rounded" placeholder="Notes (optional)" value={notes} onChange={e=>setNotes(e.target.value)} />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-3 py-1 rounded border">Cancel</button>
            <button type="submit" className="px-3 py-1 rounded bg-blue-600 text-white">{loading ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}