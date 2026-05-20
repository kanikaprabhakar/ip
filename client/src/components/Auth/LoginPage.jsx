import React, { useContext } from 'react';
import AuthContext from '../../context/AuthContext.jsx';

const LoginPage = () => {
  const { loginWithGoogle } = useContext(AuthContext);

  const handleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg to-dark-secondary flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-2">StudyRoom</h1>
          <p className="text-white/60 mb-8">Collaborative study platform for focused learners</p>

          <button
            onClick={handleLogin}
            className="w-full bg-gradient-to-r from-purple-accent to-teal-accent text-white font-semibold py-3 px-4 rounded-full hover:shadow-lg hover:shadow-purple-accent/50 transition-all duration-300 mb-4"
          >
            Sign in with Google
          </button>

          <p className="text-white/40 text-sm">
            Join a study room or create one to get started
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
