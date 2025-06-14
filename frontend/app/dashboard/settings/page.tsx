"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { UserRound, Moon, Sun, BellRing, ShieldAlert, Languages, HelpCircle, Bot } from "lucide-react"

export default function SettingsPage() {
  const [darkMode, setDarkMode] = useState(true)
  const [notifications, setNotifications] = useState(true)
  const [aiTrading, setAiTrading] = useState(false)
  const [language, setLanguage] = useState("English")

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 dark:from-white dark:to-white/80 text-transparent bg-clip-text">Settings</h1>
        <Button className="border border-border dark:border-white/20 bg-background/50 dark:bg-white/10 hover:bg-accent dark:hover:bg-white/15 text-foreground dark:text-white hover:border-border/80 dark:hover:border-white/30">Save Changes</Button>
      </div>

      <div className="backdrop-blur-sm bg-background/50 dark:bg-black/20 border border-border dark:border-white/10 rounded-xl p-6 hover:border-border/80 dark:hover:border-white/20 transition-all shadow-md">
        <h2 className="text-xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/80 dark:from-white dark:to-white/90 text-transparent bg-clip-text">Account Settings</h2>
        
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-background/50 dark:bg-white/5 border border-border dark:border-white/10">
              <UserRound className="h-6 w-6 text-foreground dark:text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium mb-1 text-foreground dark:text-white">Profile Information</h3>
              <p className="text-sm text-muted-foreground dark:text-white/60 mb-4">Update your account's profile information</p>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="display-name" className="block text-sm font-medium mb-1 text-foreground dark:text-white">Display Name</label>
                  <input 
                    type="text" 
                    id="display-name"
                    defaultValue="Astra User"
                    className="w-full p-2 rounded-md border border-border dark:border-white/10 bg-background/50 dark:bg-black/30 text-foreground dark:text-white focus:border-border/80 dark:focus:border-white/30 focus:outline-none"
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-1 text-foreground dark:text-white">Email Address</label>
                  <input 
                    type="email" 
                    id="email"
                    defaultValue="user@example.com"
                    className="w-full p-2 rounded-md border border-border dark:border-white/10 bg-background/50 dark:bg-black/30 text-foreground dark:text-white focus:border-border/80 dark:focus:border-white/30 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-background/50 dark:bg-white/5 border border-border dark:border-white/10">
              <ShieldAlert className="h-6 w-6 text-foreground dark:text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium mb-1 text-foreground dark:text-white">Security</h3>
              <p className="text-sm text-muted-foreground dark:text-white/60 mb-4">Manage your account's security settings</p>
              
              <div className="space-y-4">
                <Button variant="outline" className="border-border dark:border-white/20 hover:bg-accent dark:hover:bg-white/10 text-foreground dark:text-white">Change Password</Button>
                <Button variant="outline" className="border-border dark:border-white/20 hover:bg-accent dark:hover:bg-white/10 text-foreground dark:text-white">Enable Two-Factor Authentication</Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="backdrop-blur-sm bg-background/50 dark:bg-black/20 border border-border dark:border-white/10 rounded-xl p-6 hover:border-border/80 dark:hover:border-white/20 transition-all shadow-md">
        <h2 className="text-xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/80 dark:from-white dark:to-white/90 text-transparent bg-clip-text">Application Settings</h2>
        
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-background/50 dark:bg-white/5 border border-border dark:border-white/10">
              {darkMode ? (
                <Moon className="h-6 w-6 text-foreground dark:text-white" />
              ) : (
                <Sun className="h-6 w-6 text-foreground dark:text-white" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium mb-1 text-foreground dark:text-white">Appearance</h3>
                  <p className="text-sm text-muted-foreground dark:text-white/60">Toggle between dark and light mode</p>
                </div>
                <div className="flex items-center">
                  <button 
                    onClick={() => setDarkMode(false)}
                    className={`p-2 rounded-l-md border border-r-0 border-border dark:border-white/20 ${!darkMode ? 'bg-accent dark:bg-white/15' : 'bg-background/50 dark:bg-black/30'}`}
                  >
                    <Sun className="h-5 w-5 text-foreground dark:text-white" />
                  </button>
                  <button 
                    onClick={() => setDarkMode(true)}
                    className={`p-2 rounded-r-md border border-border dark:border-white/20 ${darkMode ? 'bg-accent dark:bg-white/15' : 'bg-background/50 dark:bg-black/30'}`}
                  >
                    <Moon className="h-5 w-5 text-foreground dark:text-white" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-background/50 dark:bg-white/5 border border-border dark:border-white/10">
              <BellRing className="h-6 w-6 text-foreground dark:text-white" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium mb-1 text-foreground dark:text-white">Notifications</h3>
                  <p className="text-sm text-muted-foreground dark:text-white/60">Receive trading and platform notifications</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={notifications} 
                    onChange={() => setNotifications(!notifications)} 
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-background/50 dark:bg-black/30 border border-border dark:border-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-foreground dark:after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent dark:peer-checked:bg-white/20"></div>
                </label>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-background/50 dark:bg-white/5 border border-border dark:border-white/10">
              <Bot className="h-6 w-6 text-foreground dark:text-white" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium mb-1 text-foreground dark:text-white">AI-Powered Trading</h3>
                  <p className="text-sm text-muted-foreground dark:text-white/60">Enable AI to make trading decisions on your behalf</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={aiTrading} 
                    onChange={() => setAiTrading(!aiTrading)} 
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-background/50 dark:bg-black/30 border border-border dark:border-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-foreground dark:after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent dark:peer-checked:bg-white/20"></div>
                </label>
              </div>
              {aiTrading && (
                <div className="mt-4 p-3 bg-background/50 dark:bg-white/5 border border-border dark:border-white/10 rounded-lg">
                  <p className="text-sm text-foreground dark:text-white">AI Trading is now <strong>enabled</strong>. Astra will analyze market conditions and execute trades according to your risk profile.</p>
                  <Button size="sm" variant="outline" className="mt-2 border-border dark:border-white/20 hover:bg-accent dark:hover:bg-white/10 text-foreground dark:text-white">Configure AI Settings</Button>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-background/50 dark:bg-white/5 border border-border dark:border-white/10">
              <Languages className="h-6 w-6 text-foreground dark:text-white" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium mb-1 text-foreground dark:text-white">Language</h3>
                  <p className="text-sm text-muted-foreground dark:text-white/60">Select your preferred language</p>
                </div>
                <select 
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="p-2 rounded-md border border-border dark:border-white/20 bg-background/50 dark:bg-black/30 text-foreground dark:text-white focus:outline-none focus:border-border/80 dark:focus:border-white/30"
                >
                  <option value="English">English</option>
                  <option value="Spanish">Spanish</option>
                  <option value="French">French</option>
                  <option value="German">German</option>
                  <option value="Japanese">Japanese</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="backdrop-blur-sm bg-background/50 dark:bg-black/20 border border-border dark:border-white/10 rounded-xl p-6 hover:border-border/80 dark:hover:border-white/20 transition-all shadow-md">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-full bg-background/50 dark:bg-white/5 border border-border dark:border-white/10">
            <HelpCircle className="h-6 w-6 text-foreground dark:text-white" />
          </div>
          <div>
            <h3 className="text-lg font-medium mb-1 text-foreground dark:text-white">Help & Support</h3>
            <p className="text-sm text-muted-foreground dark:text-white/60 mb-4">Get help with your account and the Astra DeFi platform</p>
            
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="border-border dark:border-white/20 hover:bg-accent dark:hover:bg-white/10 text-foreground dark:text-white">Documentation</Button>
              <Button variant="outline" className="border-border dark:border-white/20 hover:bg-accent dark:hover:bg-white/10 text-foreground dark:text-white">Contact Support</Button>
              <Button variant="outline" className="border-border dark:border-white/20 hover:bg-accent dark:hover:bg-white/10 text-foreground dark:text-white">FAQ</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
