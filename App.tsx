
import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import PostDetail from './pages/PostDetail';
import Admin from './pages/Admin';
import Category from './pages/Category';

const App: React.FC = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/post/:slug" element={<PostDetail />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/category/:categoryName" element={<Category />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;
