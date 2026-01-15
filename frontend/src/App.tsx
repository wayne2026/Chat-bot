import { useState } from 'react';
import Auth from './components/Auth';
import Chat from './components/Chat';

function App() {
    const [token, setToken] = useState<string | null>(null);

    const handleLogin = (token: string) => {
        setToken(token);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        setToken(null);
    };

    return (
        <div className="App">
            {!token ? (
                <Auth onLogin={handleLogin} />
            ) : (
                <Chat token={token} onLogout={handleLogout} />
            )}
        </div>
    );
}

export default App;
