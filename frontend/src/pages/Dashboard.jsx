import { useDispatch, useSelector } from "react-redux";
import { logout } from "../features/authSlice";

const Dashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 shadow-2xl w-full max-w-md text-center">
        <div className="w-14 h-14 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xl font-bold mx-auto mb-5">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <h2 className="text-2xl font-bold text-white mb-1">
          Welcome, {user?.name}!
        </h2>
        <p className="text-slate-400 text-sm mb-8">{user?.email}</p>
        <button
          onClick={() => dispatch(logout())}
          className="bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/30 font-medium rounded-lg px-6 py-2.5 text-sm transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
