'use client';

import { useState } from 'react';

interface Agent {
  id: string;
  name: string;
  email: string;
  platforms: string[];
  status: string;
  created_at: string;
}

export default function Home() {
  const [name, setName] = useState('');
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3000/api/v1/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, platforms }),
      });

      const data = await response.json();

      if (response.ok) {
        setAgent(data);
        setName('');
        setPlatforms([]);
      } else {
        setError(data.error || 'Failed to create agent');
      }
    } catch (err) {
      setError('Failed to connect to API');
    } finally {
      setLoading(false);
    }
  };

  const togglePlatform = (platform: string) => {
    setPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-6 px-4">
          <h1 className="text-3xl font-bold text-gray-900">
            🦞 CLAW ID - AI 智能体身份证
          </h1>
          <p className="mt-2 text-gray-600">
            为 AI 智能体提供独立、合规、可管理的数字身份
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-12 px-4">
        {/* 创建智能体表单 */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-6">创建数字员工</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                智能体名称
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border"
                placeholder="例如: Marketing Bot"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                选择平台
              </label>
              <div className="flex gap-4">
                {['github', 'reddit', 'discord'].map(platform => (
                  <label key={platform} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={platforms.includes(platform)}
                      onChange={() => togglePlatform(platform)}
                      className="rounded border-gray-300 text-blue-600 mr-2"
                    />
                    <span className="capitalize">{platform}</span>
                  </label>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-2 rounded">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !name}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? '创建中...' : '创建智能体'}
            </button>
          </form>
        </div>

        {/* 创建成功提示 */}
        {agent && (
          <div className="bg-green-50 border border-green-200 rounded-xl shadow-lg p-8 mb-8">
            <h3 className="text-xl font-semibold text-green-800 mb-4">
              ✅ 智能体创建成功！
            </h3>
            <div className="bg-white rounded-lg p-4 space-y-2">
              <p><strong>ID:</strong> {agent.id}</p>
              <p><strong>名称:</strong> {agent.name}</p>
              <p><strong>邮箱:</strong> {agent.email}</p>
              <p><strong>平台:</strong> {agent.platforms.join(', ') || '未选择'}</p>
              <p><strong>状态:</strong> {agent.status}</p>
              <p><strong>创建时间:</strong> {new Date(agent.created_at).toLocaleString('zh-CN')}</p>
            </div>
            <p className="text-sm text-gray-600 mt-4">
              💡 智能体已创建，邮箱为 {agent.email}。接下来可以为它注册平台账号！
            </p>
          </div>
        )}

        {/* 功能说明 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-lg font-semibold mb-2">独立身份</h3>
            <p className="text-gray-600 text-sm">
              每个 AI 智能体都有独立的邮箱和账号，真正实现自主运营
            </p>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="text-4xl mb-4">🔐</div>
            <h3 className="text-lg font-semibold mb-2">安全合规</h3>
            <p className="text-gray-600 text-sm">
              AES-256 加密，OAuth 2.0 认证，完整的审计日志
            </p>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="text-4xl mb-4">🚀</div>
            <h3 className="text-lg font-semibold mb-2">多平台支持</h3>
            <p className="text-gray-600 text-sm">
              支持 GitHub、Reddit、Discord 等主流平台，一键注册
            </p>
          </div>
        </div>

        {/* API 状态 */}
        <div className="mt-8 bg-blue-50 rounded-lg p-4 text-sm">
          <p className="font-semibold mb-2">📡 API 状态</p>
          <p>后端服务: <span className="text-green-600">http://localhost:3000</span></p>
          <p>健康检查: <code className="bg-white px-2 py-1 rounded">curl http://localhost:3000/health</code></p>
        </div>
      </main>

      <footer className="bg-white border-t mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-600 text-sm">
          <p>🦞 CLAW ID - 由 CLAW.AI 开发和维护</p>
          <p className="mt-1">
            <a href="https://sendwealth.github.io/claw-intelligence/" className="text-blue-600 hover:underline">
              官网
            </a>
            {' • '}
            <a href="https://github.com/sendwealth/claw-id" className="text-blue-600 hover:underline">
              GitHub
            </a>
            {' • '}
            <a href="https://discord.com/invite/clawd" className="text-blue-600 hover:underline">
              Discord
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
