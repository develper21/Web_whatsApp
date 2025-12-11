import { useState } from "react";
import { FaComments } from "react-icons/fa6";
import { useAuthStore } from "../../state/authStore";

const initialLogin = { email: "", password: "" };
const initialRegister = { name: "", email: "", password: "" };

export const AuthView = () => {
  const [loginValues, setLoginValues] = useState(initialLogin);
  const [registerValues, setRegisterValues] = useState(initialRegister);
  const { login, register, loading, error } = useAuthStore();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await login(loginValues);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await register(registerValues);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 rounded-full mb-4">
            <FaComments className="text-white text-2xl" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AlgoChat</h1>
          <p className="text-gray-600">Real-time messaging for modern teams</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="flex border-b">
            <button className="flex-1 py-3 px-4 text-center font-medium text-blue-600 border-b-2 border-blue-600 bg-blue-50">
              Login
            </button>
            <button className="flex-1 py-3 px-4 text-center font-medium text-gray-500 hover:text-gray-700">
              Register
            </button>
          </div>
          
          <div className="p-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  id="login-email"
                  type="email"
                  value={loginValues.email}
                  onChange={(e) => setLoginValues({ ...loginValues, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  id="login-password"
                  type="password"
                  value={loginValues.password}
                  onChange={(e) => setLoginValues({ ...loginValues, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              {error && (
                <p className="text-red-500 text-sm">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>

            <form onSubmit={handleRegister} className="space-y-4 mt-6">
              <div>
                <label htmlFor="register-name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  id="register-name"
                  value={registerValues.name}
                  onChange={(e) => setRegisterValues({ ...registerValues, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label htmlFor="register-email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  id="register-email"
                  type="email"
                  value={registerValues.email}
                  onChange={(e) => setRegisterValues({ ...registerValues, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label htmlFor="register-password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  id="register-password"
                  type="password"
                  value={registerValues.password}
                  onChange={(e) => setRegisterValues({ ...registerValues, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              {error && (
                <p className="text-red-500 text-sm">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Creating Account..." : "Create Account"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
