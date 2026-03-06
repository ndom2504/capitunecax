import { useState, useEffect } from 'react';
import { DollarSign, PieChart, Plus, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';

const DEFAULT_EXPENSES = [
  { id: 1, category: "Immigration", name: "CAQ", amount: 124 },
  { id: 2, category: "Immigration", name: "Permis d'études", amount: 150 },
  { id: 3, category: "Immigration", name: "Biométrie", amount: 85 },
  { id: 4, category: "Vie", name: "Assurance santé (1 an)", amount: 900 },
  { id: 5, category: "Vie", name: "Billet d'avion (est.)", amount: 1200 },
  { id: 6, category: "Logement", name: "Loyer (1er mois + caution)", amount: 2000 },
];

export default function BudgetCalculator() {
  const [expenses, setExpenses] = useState(DEFAULT_EXPENSES);
  const [newItem, setNewItem] = useState({ name: '', amount: 0, category: 'Autre' });

  const total = expenses.reduce((acc, item) => acc + item.amount, 0);

  const handleAdd = () => {
    if (!newItem.name || newItem.amount <= 0) return;
    setExpenses([...expenses, { id: Date.now(), ...newItem }]);
    setNewItem({ name: '', amount: 0, category: 'Autre' });
  };

  const handleDelete = (id: number) => {
    setExpenses(expenses.filter(e => e.id !== id));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text">Calculateur de Budget</h1>
        <p className="text-text-muted mt-2">Estimez vos coûts d'installation et de démarches.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Expense List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface p-6 rounded-xl shadow-sm border border-border">
            <h2 className="font-semibold text-text mb-4">Dépenses prévues</h2>
            
            <div className="space-y-3">
              {expenses.map((item) => (
                <motion.div 
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center justify-between p-3 bg-bg-light rounded-lg group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-text">{item.name}</p>
                      <p className="text-xs text-text-muted">{item.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-text-secondary">{item.amount} $</span>
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="text-text-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Add New */}
            <div className="mt-6 pt-6 border-t border-border">
              <h3 className="text-sm font-medium text-text-secondary mb-3">Ajouter une dépense</h3>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Nom (ex: Meubles)" 
                  className="flex-1 px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-orange/20"
                  value={newItem.name}
                  onChange={e => setNewItem({...newItem, name: e.target.value})}
                />
                <input 
                  type="number" 
                  placeholder="Montant" 
                  className="w-24 px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-orange/20"
                  value={newItem.amount || ''}
                  onChange={e => setNewItem({...newItem, amount: parseFloat(e.target.value)})}
                />
                <button 
                  onClick={handleAdd}
                  className="p-2 bg-orange text-white rounded-lg hover:bg-orange-light"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="space-y-6">
          <div className="bg-primary-dark text-white p-6 rounded-xl shadow-lg">
            <h2 className="text-white/60 text-sm font-medium uppercase tracking-wider">Total Estimé</h2>
            <div className="mt-2 text-4xl font-bold flex items-baseline gap-1">
              {total} <span className="text-xl font-normal text-white/60">CAD</span>
            </div>
            <p className="mt-4 text-sm text-white/60">
              Ce montant couvre vos démarches administratives et votre installation initiale.
            </p>
          </div>

          <div className="bg-surface p-6 rounded-xl shadow-sm border border-border">
            <h3 className="font-semibold text-text mb-4 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-primary" /> Répartition
            </h3>
            {/* Simple breakdown visualization */}
            <div className="space-y-3">
              {['Immigration', 'Vie', 'Logement', 'Autre'].map(cat => {
                const catTotal = expenses.filter(e => e.category === cat).reduce((a, b) => a + b.amount, 0);
                if (catTotal === 0) return null;
                const percent = Math.round((catTotal / total) * 100);
                return (
                  <div key={cat}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-text-secondary">{cat}</span>
                      <span className="font-medium text-text">{percent}%</span>
                    </div>
                    <div className="h-2 bg-bg-light rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full" 
                        style={{ width: `${percent}%` }} 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
