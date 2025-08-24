import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import TransactionModal from "./TransactionModal";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#9C27B0", "#E91E63"];

export default function Dashboard() {
  const [summary, setSummary] = useState({ total_income: 0, total_expenses: 0 });
  const [incomeData, setIncomeData] = useState([]);
  const [expenseData, setExpenseData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("income"); // 'income' | 'expense'

  useEffect(() => {
    fetchAll();

    // realtime refresh on inserts/updates/deletes
    const chIncome = supabase
      .channel("income-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "income" }, fetchAll)
      .subscribe();

    const chExpense = supabase
      .channel("expenses-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "expenses" }, fetchAll)
      .subscribe();

    return () => {
      supabase.removeChannel(chIncome);
      supabase.removeChannel(chExpense);
    };
  }, []);

  async function fetchAll() {
    // Totals
    const { data: sum } = await supabase.from("ledger_summary").select("*").single();
    if (sum) setSummary(sum);

    // Income → group by source
    const { data: incomes } = await supabase.from("income").select("source, amount");
    if (incomes) {
      const g = incomes.reduce((acc, cur) => {
        const key = cur.source || "Uncategorized";
        acc[key] = (acc[key] || 0) + Number(cur.amount || 0);
        return acc;
      }, {});
      setIncomeData(Object.entries(g).map(([name, value]) => ({ name, value })));
    }

    // Expenses → group by category (IMPORTANT)
    const { data: expenses } = await supabase.from("expenses").select("category, amount");
    if (expenses) {
      const g = expenses.reduce((acc, cur) => {
        const key = cur.category || "Uncategorized";
        acc[key] = (acc[key] || 0) + Number(cur.amount || 0);
        return acc;
      }, {});
      setExpenseData(Object.entries(g).map(([name, value]) => ({ name, value })));
    }
  }

  return (
    <div>
      {/* Quick actions */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => { setModalMode("income"); setShowModal(true); }}
          className="px-4 py-2 rounded bg-green-600 text-white"
        >
          Add Income
        </button>
        <button
          onClick={() => { setModalMode("expense"); setShowModal(true); }}
          className="px-4 py-2 rounded bg-red-600 text-white"
        >
          Add Expense
        </button>
      </div>

      {/* Pie charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Income */}
        <div className="bg-white p-4 shadow rounded-2xl">
          <h3 className="text-lg font-semibold mb-2 text-center">Income Distribution</h3>
          <div className="h-64">
            {incomeData.length ? (
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={incomeData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
                    {incomeData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">No income data yet</div>
            )}
          </div>
          <p className="text-center font-medium mt-2">
            Total Income: ₹{Number(summary.total_income || 0).toFixed(2)}
          </p>
        </div>

        {/* Expense */}
        <div className="bg-white p-4 shadow rounded-2xl">
          <h3 className="text-lg font-semibold mb-2 text-center">Expense Distribution</h3>
          <div className="h-64">
            {expenseData.length ? (
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={expenseData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
                    {expenseData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">No expense data yet</div>
            )}
          </div>
          <p className="text-center font-medium mt-2">
            Total Expenses: ₹{Number(summary.total_expenses || 0).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-semibold mb-2">Recent Transactions</h3>
        <RecentList />
      </div>

      {showModal && (
        <TransactionModal
          mode={modalMode}
          onClose={() => {
            setShowModal(false);
            fetchAll();
          }}
        />
      )}
    </div>
  );
}

function RecentList() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    load();

    // realtime for recent list
    const ch = supabase
      .channel("recent-tx")
      .on("postgres_changes", { event: "*", schema: "public", table: "income" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "expenses" }, load)
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  async function load() {
    // Prefer RPC if available
    const { data, error } = await supabase.rpc("get_recent_transactions", { limit_in: 8 });
    if (data && !error) {
      setItems(data);
      return;
    }
    // Fallback: merge from 2 tables
    const [inc, exp] = await Promise.all([
      supabase.from("income").select("id,date,source,amount").limit(50),
      supabase.from("expenses").select("id,date,category,amount").limit(50),
    ]);
    const merged = [];
    if (inc.data)
      merged.push(
        ...inc.data.map((r) => ({
          id: `inc-${r.id}`,
          date: r.date,
          type: "income",
          category: r.source,
          amount: r.amount,
        }))
      );
    if (exp.data)
      merged.push(
        ...exp.data.map((r) => ({
          id: `exp-${r.id}`,
          date: r.date,
          type: "expense",
          category: r.category,
          amount: r.amount,
        }))
      );
    merged.sort((a, b) => new Date(b.date) - new Date(a.date));
    setItems(merged.slice(0, 8));
  }

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
          {items.map((i) => (
            <tr key={i.id} className="border-b">
              <td className="py-2">{i.date}</td>
              <td className="capitalize">{i.type}</td>
              <td>{i.category}</td>
              <td className={`${i.type === "income" ? "text-green-700" : "text-red-700"}`}>
                ₹{Number(i.amount).toFixed(2)}
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td colSpan="4" className="text-center py-4 text-gray-500">No recent transactions</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
