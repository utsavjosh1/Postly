export function ChatPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-3xl font-bold mb-4">AI Job Assistant</h1>
        <p className="text-gray-600 mb-6">
          Chat with our AI to find the perfect job matches. Upload your resume to get started!
        </p>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
          <div className="text-6xl mb-4">💬</div>
          <h3 className="text-xl font-semibold mb-2">Coming Soon</h3>
          <p className="text-gray-600">
            ChatGPT-like interface for job matching will be available here.
          </p>
        </div>
      </div>
    </div>
  );
}
