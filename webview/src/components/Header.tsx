import { A, useNavigate } from '@solidjs/router';
import { clearToken, getToken } from '../utils/auth';

const LOGO_URL = 'https://cdn.hjfy.top/web/assets/logo-CXAgV_6N.svg';

const Header = () => {
  const navigate = useNavigate();
  const logout = () => { clearToken(); navigate('/login'); };
  const authed = !!getToken();
  return (
    <header class="border-b border-gray-950/5 flex h-12 items-center px-2">
      <div class="flex items-center">
        <span class="shrink-0" aria-label="Home">
          <img alt="logo" class="h-8 w-8" src={LOGO_URL} />
        </span>
        <div class="pl-2">LaTeXTrans</div>
      </div>
      <div class="flex-1 text-center">
        <A href="/" class="text-sm/6 font-semibold text-gray-900 cursor-pointer hover:text-indigo-800">首页</A>
        <A href="/history" class="text-sm/6 font-semibold text-gray-900 cursor-pointer hover:text-indigo-800 ml-6">历史</A>
      </div>
      <div class="flex justify-end">
        {authed ? (
          <button class="text-sm/6 text-gray-950 pl-2 pr-2" onClick={logout}>退出</button>
        ) : (
          <A href="/login" class="text-sm/6 text-gray-950 pl-2 pr-2">登录</A>
        )}
      </div>
    </header>
  );
};

export default Header;

