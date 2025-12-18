import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import styled from '@emotion/styled';

// --- Styling ---
const GlobalStyles = styled.div`
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  background: #f0f2f5;
  min-height: 100vh;
  color: #1a1a1a;
`;

const Navbar = styled.nav`
  background: white;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  position: sticky;
  top: 0;
  z-index: 100;
`;

const Logo = styled.div`
  font-size: 1.5rem;
  font-weight: 800;
  color: #0070f3;
  cursor: pointer;
  letter-spacing: -0.5px;
`;

const Container = styled.div`
  max-width: 1000px;
  margin: 3rem auto;
  padding: 0 1rem;
`;

const Card = styled.div`
  background: white;
  border-radius: 16px;
  padding: 2.5rem;
  box-shadow: 0 4px 24px rgba(0,0,0,0.06);
`;

const Title = styled.h1`
  font-size: 2rem;
  margin-bottom: 2rem;
  text-align: center;
  font-weight: 700;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  max-width: 400px;
  margin: 0 auto;
`;

const Input = styled.input`
  padding: 0.875rem 1rem;
  border-radius: 8px;
  border: 1px solid #e1e4e8;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s;
  &:focus { border-color: #0070f3; }
`;

const Textarea = styled.textarea`
  padding: 0.875rem 1rem;
  border-radius: 8px;
  border: 1px solid #e1e4e8;
  font-size: 1rem;
  min-height: 150px;
  outline: none;
  resize: vertical;
  &:focus { border-color: #0070f3; }
`;

const Button = styled.button`
  padding: 0.875rem;
  border-radius: 8px;
  background: #0070f3;
  color: white;
  border: none;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: opacity 0.2s;
  &:hover { opacity: 0.9; }
  &:disabled { background: #ccc; cursor: not-allowed; }
`;

const GhostButton = styled.button`
  background: none;
  border: none;
  color: #0070f3;
  font-weight: 600;
  cursor: pointer;
  &:hover { text-decoration: underline; }
`;

const BotList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
`;

const BotCard = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid #eee;
  transition: transform 0.2s, box-shadow 0.2s;
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 20px rgba(0,0,0,0.05);
  }
`;

const Snippet = styled.pre`
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  overflow-x: auto;
  border: 1px solid #eee;
  margin-top: 1rem;
  color: #333;
`;

// --- Components ---

function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login'); // login, register, dashboard, create
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [bots, setBots] = useState([]);
  const [botName, setBotName] = useState('');
  const [context, setContext] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setUser({ token });
      setView('dashboard');
      fetchBots(token);
    }
  }, []);

  const fetchBots = async (token) => {
    try {
      const res = await fetch('http://localhost:8000/bots', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBots(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    const endpoint = view === 'login' ? 'token' : 'register';

    try {
      let body;
      if (view === 'login') {
        body = new URLSearchParams({ username: email, password });
      } else {
        body = JSON.stringify({ email, password });
      }

      const res = await fetch(`http://localhost:8000/${endpoint}`, {
        method: 'POST',
        headers: view === 'login' ? { 'Content-Type': 'application/x-www-form-urlencoded' } : { 'Content-Type': 'application/json' },
        body
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('token', data.access_token);
        setUser({ token: data.access_token });
        setView('dashboard');
        fetchBots(data.access_token);
      } else {
        alert('Authentication failed');
      }
    } catch (e) {
      alert('Error: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBot = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/create-bot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ name: botName, context })
      });
      if (res.ok) {
        setBotName('');
        setContext('');
        setView('dashboard');
        fetchBots(user.token);
      }
    } catch (e) {
      alert('Error creating bot');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setView('login');
  };

  return (
    <GlobalStyles>
      <Navbar>
        <Logo onClick={() => setView(user ? 'dashboard' : 'login')}>MyBot</Logo>
        {user && <GhostButton onClick={logout}>Logout</GhostButton>}
      </Navbar>

      <Container>
        {view === 'login' || view === 'register' ? (
          <Card>
            <Title>{view === 'login' ? 'Welcome Back' : 'Get Started'}</Title>
            <Form onSubmit={handleAuth}>
              <Input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
              <Input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
              <Button type="submit" disabled={loading}>{loading ? 'Please wait...' : view === 'login' ? 'Sign In' : 'Create Account'}</Button>
              <div style={{ textAlign: 'center', fontSize: '0.9rem' }}>
                {view === 'login' ? "Don't have an account? " : "Already have an account? "}
                <GhostButton type="button" onClick={() => setView(view === 'login' ? 'register' : 'login')}>
                  {view === 'login' ? 'Register' : 'Login'}
                </GhostButton>
              </div>
            </Form>
          </Card>
        ) : view === 'dashboard' ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Your Chatbots</h2>
              <Button onClick={() => setView('create')}>+ Create New Bot</Button>
            </div>
            {bots.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#666', marginTop: '4rem' }}>You haven't created any bots yet.</p>
            ) : (
              <BotList>
                {bots.map(bot => (
                  <BotCard key={bot.id}>
                    <h3 style={{ margin: '0 0 0.5rem 0', fontWeight: 700 }}>{bot.name}</h3>
                    <p style={{ fontSize: '0.9rem', color: '#666', margin: 0 }}>ID: {bot.bot_id}</p>
                    <div style={{ marginTop: '1rem' }}>
                      <p style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.5rem', color: '#0070f3' }}>Embed Code:</p>
                      <Snippet>{`<script src="http://localhost:8000/widget/chat-widget.js" data-bot-id="${bot.bot_id}"></script>`}</Snippet>
                    </div>
                  </BotCard>
                ))}
              </BotList>
            )}
          </div>
        ) : (
          <Card>
            <Title>Create New Bot</Title>
            <Form onSubmit={handleCreateBot}>
              <Input placeholder="Bot Name (e.g., Customer Support)" value={botName} onChange={e => setBotName(e.target.value)} required />
              <Textarea placeholder="What should this bot know? Paste your content/knowledge base here..." value={context} onChange={e => setContext(e.target.value)} required />
              <Button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Launch Bot'}</Button>
              <GhostButton type="button" onClick={() => setView('dashboard')}>Cancel</GhostButton>
            </Form>
          </Card>
        )}
      </Container>
    </GlobalStyles>
  );
}

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);