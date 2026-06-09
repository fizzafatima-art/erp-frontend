import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    // Mock login logic since backend auth is empty
    if (username && password) {
      localStorage.setItem('token', 'mock-jwt-token');
      navigate('/');
    } else {
      alert('Please enter credentials');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f5f5f5' }}>
      <div className="card" style={{ width: '300px' }}>
        <h2 style={{ textAlign: 'center' }}>ERP Login</h2>
        <form onSubmit={handleLogin}>
          <Input label="Username" value={username} onChange={e => setUsername(e.target.value)} />
          <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
          <Button type="submit" style={{ width: '100%', marginTop: '10px' }}>Login</Button>
        </form>
      </div>
    </div>
  );
}
