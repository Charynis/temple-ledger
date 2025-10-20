import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import dayjs from 'dayjs'
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function TransactionModal({ mode='income', onClose, editItem=null }) {
  const isIncome = mode === 'income'
  const [transactionDate, setTransactionDate] = useState(editItem ? editItem.transactionDate : dayjs().format('YYYY-MM-DD'))
  const [sourceOrCategory, setSourceOrCategory] = useState(editItem ? (isIncome ? editItem.source : editItem.category) : '')
  const [amount, setAmount] = useState(editItem ? editItem.amount : '')
  const [notes, setNotes] = useState(editItem ? editItem.notes : '')
  const [loading, setLoading] = useState(false)
  const [dueMonth, setDueMonth] = useState(editItem ? editItem.due_month ? new Date(editItem.due_month) : null : null)
  const [event, setEvent] = useState(editItem ? editItem.event || 'General' : 'General')
  const [showDueMonth, setShowDueMonth] = useState(false)

  // Example predefined lists
  const incomeSources = ['Receipt Books', 'Rent', 'Hundi', 'Others']
  const expenseCategories = ['Salary', 'Utilities', 'Others']
  const dueMonthShowList = ['rent', 'salary']

  // Show due month only for rent or salary
  useEffect(() => {
    if (dueMonthShowList.includes(sourceOrCategory.toLowerCase())) {
      setShowDueMonth(true)
    } else {
      setShowDueMonth(false)
      setDueMonth(null)
    }
  }, [sourceOrCategory])

  async function handleSubmit(e) {
    e.preventDefault();
    
    setLoading(true)
    const table = isIncome ? 'income' : 'expenses'

    try {
      const uid = (await supabase.auth.getSession()).data.session.user.id
      const formattedDueMonth = dueMonth ? dayjs(dueMonth).format('YYYY-MM')+"-09" : null
      const payload = {
        date: transactionDate,
        amount,
        notes,
        event,
        due_month: formattedDueMonth,
        user_id: uid,
        ...(isIncome ? { source: sourceOrCategory } : { category: sourceOrCategory })
      }

      if (editItem) {
        const { error } = await supabase
          .from(table)
          .update(payload)
          .eq('id', editItem.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from(table).insert(payload)
        if (error) throw error
      }

      onClose()
    } catch (err) {
      console.error(err)
      alert(err.message || 'Error saving transaction')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center modal-backdrop">
      <div className="bg-white w-full max-w-md p-4 rounded shadow z-50">
        <h3 className="font-semibold mb-2">{editItem ? 'Edit' : 'Add'} {isIncome ? 'Income' : 'Expense'}</h3>
        <form onSubmit={handleSubmit} className="space-y-2">
          <input
            type="date"
            className="w-full p-2 border rounded"
            value={transactionDate}
            onChange={e => setTransactionDate(e.target.value)}
            required
          />

          <label className="block font-medium">Event:</label>
          <select
            className="w-full p-2 border rounded"
            value={event}
            onChange={e => setEvent(e.target.value)}
          >
            <option value="General">General</option>
            <option value="Bonalu">Bonalu</option>
            <option value="Navarathri">Navarathri</option>
            <option value="Miscellaneous">Miscellaneous</option>
          </select>

          <select
            className="w-full p-2 border rounded"
            value={sourceOrCategory}
            onChange={e => setSourceOrCategory(e.target.value)}
            required
          >
            <option value="">{isIncome ? 'Select Source' : 'Select Category'}</option>
            {(isIncome ? incomeSources : expenseCategories).map((opt, i) => (
              <option key={i} value={opt}>{opt}</option>
            ))}
          </select>

          {showDueMonth && (
            <label className="font-small">Due Month: &nbsp;
              <DatePicker
                selected={dueMonth}
                onChange={(date) => setDueMonth(date)}
                placeholderText="Select due month"
                dateFormat="MM/yyyy"
                showMonthYearPicker
                showFullMonthYearPicker
                className="p-2 border rounded"
              />
            </label>
          )}

          <input
            type="number"
            step="0.01"
            className="w-full p-2 border rounded"
            placeholder="Amount"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            required
          />

          <textarea
            className="w-full p-2 border rounded"
            placeholder="Notes (optional)"
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />

          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-3 py-1 rounded border">Cancel</button>
            <button type="submit" className="px-3 py-1 rounded bg-blue-600 text-white">
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

