import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { MintChicken } from '../components/MintChicken'
import { useLanguage } from '../contexts/LanguageContext'
import { Button } from '../components/ui/button'
import farmLogo from '../assets/futuristic_farm_logo_embedded.svg'

const Whitelist: React.FC = () => {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Back Button */}
      <div className="relative z-10 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/">
            <Button variant="ghost" className="text-white hover:text-white hover:bg-white/10 mb-8">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('whitelist.backToHome')}
            </Button>
          </Link>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 animate-aurora"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <img
                  src={farmLogo}
                  alt="Pudgy Farms Logo"
                  className="w-20 h-20 md:w-24 md:h-24 object-contain animate-float"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-pink-400/20 rounded-full blur-xl animate-glow"></div>
              </div>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Mint sua PudgyChicken
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              Conecte sua carteira e faça o mint da sua primeira PudgyChicken NFT
            </p>
            
            {/* Contador de Vagas Limitadas */}
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 max-w-md mx-auto mb-8">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-red-400 font-semibold text-lg">
                  {t('whitelist.limitedSpots.title')}
                </span>
              </div>
              <p className="text-red-300 text-sm">
                {t('whitelist.limitedSpots.description')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mint Section */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center">
            <MintChicken />
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="py-20 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {t('whitelist.whyJoin.title')}
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              {t('whitelist.whyJoin.subtitle')}
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            <div className="text-center group">
              <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-500/30 transition-all duration-300">
                <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4">
                {t('whitelist.benefits.title')}
              </h3>
              <p className="text-gray-300 leading-relaxed">
                {t('whitelist.benefits.description')}
              </p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-green-500/30 transition-all duration-300">
                <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4">
                {t('whitelist.process.title')}
              </h3>
              <p className="text-gray-300 leading-relaxed">
                {t('whitelist.process.description')}
              </p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-purple-500/30 transition-all duration-300">
                <svg className="w-10 h-10 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4">
                {t('whitelist.community.title')}
              </h3>
              <p className="text-gray-300 leading-relaxed">
                {t('whitelist.community.description')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Whitelist
