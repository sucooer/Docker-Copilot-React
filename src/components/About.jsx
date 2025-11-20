import React from 'react'

export function About() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 md:p-8 transition-colors duration-200">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">关于 Docker Copilot</h1>
        </div>

        <div className="space-y-6 text-gray-800 dark:text-gray-200">
          <div className="rounded-lg bg-gray-50 dark:bg-gray-700/50 p-6 transition-colors duration-200">
            <p className="mb-4 leading-relaxed">
              一些个人的碎碎念，
              首先非常感谢大家自项目开始以来的使用、建议、鼓励和支持，然后要感谢绿联对本项目的支持。
              没有大家的这些反馈DC不会是今天的这个样子。他是属于我们共同的作品，我会继续尽力去维护好这个项目。
            </p>
          </div>
          
          <div className="rounded-lg bg-gray-50 dark:bg-gray-700/50 p-6 transition-colors duration-200">
            <p className="mb-4 leading-relaxed">
              如果在项目使用中遇到了bug或者想要提建议，可以在GitHub的issue提出或者可以给我的邮箱
              <a 
                href="mailto:onlylty@lty.wiki" 
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline transition-colors duration-200"
              >
                onlylty@lty.wiki
              </a>
              发送邮件。期待您的反馈。
            </p>
          </div>
          
          <div className="rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border border-blue-200 dark:border-blue-800/50 p-6 transition-all duration-200 hover:shadow-md">
            <h2 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-3">最后的最后</h2>
            <p className="text-blue-700 dark:text-blue-300 leading-relaxed">
              如果您用的愉快的话，可以请我喝一瓶快乐水吗？
            </p>
            
            {/* 为赞赏码预留空间 */}
            <div className="mt-6">
              <p className="text-sm text-blue-600 dark:text-blue-400 mb-3">您的支持是我持续维护项目的动力</p>
              <div className="flex flex-col sm:flex-row gap-16 justify-center" id="sponsorship-section">
                <div className="flex flex-col items-center">
                  <div className="rounded-xl overflow-hidden w-40 h-40 flex items-center justify-center bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 shadow-lg transition-all duration-200 hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-500">
                    <img 
                      src="/wechat.jpg" 
                      alt="微信赞赏码" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <span className="mt-2 text-sm text-blue-700 dark:text-blue-300">微信扫一扫</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="rounded-xl overflow-hidden w-40 h-40 flex items-center justify-center bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 shadow-lg transition-all duration-200 hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-500">
                    <img 
                      src="/alipay.jpg" 
                      alt="支付宝赞赏码" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <span className="mt-2 text-sm text-blue-700 dark:text-blue-300">支付宝扫一扫</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}