/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import EducationSearch from '@/pages/EducationSearch';
import JobSearch from '@/pages/JobSearch';
import HousingSearch from '@/pages/HousingSearch';
import LetterGenerator from '@/pages/LetterGenerator';
import BudgetCalculator from '@/pages/BudgetCalculator';
import MapSearch from '@/pages/MapSearch';

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/education" element={<EducationSearch />} />
          <Route path="/jobs" element={<JobSearch />} />
          <Route path="/housing" element={<HousingSearch />} />
          <Route path="/map" element={<MapSearch />} />
          <Route path="/letter" element={<LetterGenerator />} />
          <Route path="/budget" element={<BudgetCalculator />} />
        </Routes>
      </Layout>
    </Router>
  );
}
