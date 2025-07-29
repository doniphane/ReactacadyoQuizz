
import LoginPage from './pages/LoginPage'; 

function App() {

  const handleLogin = (data: { email: string; password: string }) => {
    console.log('Connexion réussie avec:', data);
   
  };

  return (
    <div className="App">

      <LoginPage onLogin={handleLogin} />
    </div>
  );
}

export default App
