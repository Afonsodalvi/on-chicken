import React, { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { useLanguage } from '../contexts/LanguageContext'
import { whitelistService, WhitelistEntry } from '../lib/supabase'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Alert, AlertDescription } from './ui/alert'
import { Badge } from './ui/badge'
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface WhitelistFormProps {
  onSuccess?: () => void
}

export const WhitelistForm: React.FC<WhitelistFormProps> = ({ onSuccess }) => {
  const { t } = useLanguage()
  const { address, isConnected } = useAccount()
  
  const [formData, setFormData] = useState({
    user_name: '',
    email: '',
    twitter_post_url: '',
    instagram_post_url: '',
    linkedin_post_url: '',
    other_social_url: ''
  })
  
  const [isLoading, setIsLoading] = useState(false)
  const [whitelistStatus, setWhitelistStatus] = useState<WhitelistEntry | null>(null)
  const [isCheckingStatus, setIsCheckingStatus] = useState(false)

  // Verificar status da whitelist quando o endereço mudar
  useEffect(() => {
    if (address) {
      checkWhitelistStatus()
    }
  }, [address])

  const checkWhitelistStatus = async () => {
    if (!address) return
    
    setIsCheckingStatus(true)
    try {
      const result = await whitelistService.checkWhitelistStatus(address)
      if (result.success) {
        setWhitelistStatus(result.data)
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error)
    } finally {
      setIsCheckingStatus(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!address) {
      toast.error(t('whitelist.connectWalletFirst'))
      return
    }

    // Nome não é mais obrigatório

    setIsLoading(true)
    
    try {
      const result = await whitelistService.addToWhitelist({
        wallet_address: address,
        user_name: formData.user_name?.trim() || undefined,
        email: formData.email?.trim() || undefined,
        twitter_post_url: formData.twitter_post_url?.trim() || undefined,
        instagram_post_url: formData.instagram_post_url?.trim() || undefined,
        linkedin_post_url: formData.linkedin_post_url?.trim() || undefined,
        other_social_url: formData.other_social_url?.trim() || undefined,
        status: 'pending'
      })

      if (result.success) {
        toast.success(t('whitelist.submittedSuccessfully'))
        setWhitelistStatus(result.data)
        setFormData({
          user_name: '',
          email: '',
          twitter_post_url: '',
          instagram_post_url: '',
          linkedin_post_url: '',
          other_social_url: ''
        })
        onSuccess?.()
      } else {
        toast.error(result.error || t('whitelist.submissionError'))
      }
    } catch (error) {
      console.error('Erro ao submeter whitelist:', error)
      toast.error(t('whitelist.submissionError'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default" className="bg-green-500">{t('whitelist.approved')}</Badge>
      case 'rejected':
        return <Badge variant="destructive">{t('whitelist.rejected')}</Badge>
      case 'pending':
        return <Badge variant="secondary">{t('whitelist.pending')}</Badge>
      default:
        return <Badge variant="outline">{t('whitelist.unknown')}</Badge>
    }
  }

  if (!isConnected) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center">{t('whitelist.title')}</CardTitle>
          <CardDescription className="text-center">
            {t('whitelist.connectWalletFirst')}
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (isCheckingStatus) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">{t('whitelist.checkingStatus')}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (whitelistStatus) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center flex items-center justify-center gap-2">
            {getStatusIcon(whitelistStatus.status)}
            {t('whitelist.statusTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            {getStatusBadge(whitelistStatus.status)}
          </div>
          
          <div className="space-y-2 text-sm">
            <div>
              <strong>{t('whitelist.walletAddress')}:</strong>
              <p className="font-mono text-xs break-all">{whitelistStatus.wallet_address}</p>
            </div>
            
            {whitelistStatus.user_name && (
              <div>
                <strong>{t('whitelist.name')}:</strong>
                <p>{whitelistStatus.user_name}</p>
              </div>
            )}
            
            {whitelistStatus.created_at && (
              <div>
                <strong>{t('whitelist.submittedAt')}:</strong>
                <p>{new Date(whitelistStatus.created_at).toLocaleDateString()}</p>
              </div>
            )}
            
            {whitelistStatus.notes && (
              <div>
                <strong>{t('whitelist.notes')}:</strong>
                <p className="text-sm text-muted-foreground">{whitelistStatus.notes}</p>
              </div>
            )}
          </div>

          {whitelistStatus.status === 'pending' && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {t('whitelist.pendingMessage')}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">{t('whitelist.title')}</CardTitle>
        <CardDescription className="text-center">
          {t('whitelist.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="wallet_address">{t('whitelist.walletAddress')}</Label>
            <Input
              id="wallet_address"
              value={address || ''}
              disabled
              className="font-mono text-xs"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="user_name">{t('whitelist.name')}</Label>
            <Input
              id="user_name"
              value={formData.user_name}
              onChange={(e) => handleInputChange('user_name', e.target.value)}
              placeholder={t('whitelist.namePlaceholder')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t('whitelist.email')}</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder={t('whitelist.emailPlaceholder')}
            />
            <p className="text-xs text-muted-foreground">
              {t('whitelist.emailOptional')}
            </p>
          </div>

          {/* Mensagem sugerida */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-blue-400 mb-2">{t('whitelist.suggestedMessage.title')}</h4>
            <p className="text-sm text-blue-300 mb-3">{t('whitelist.suggestedMessage.text')}</p>
            <div className="bg-black/20 rounded p-3 font-mono text-xs text-blue-200">
              {t('whitelist.suggestedMessage.example')}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="twitter_post_url">{t('whitelist.twitterPost')}</Label>
            <Input
              id="twitter_post_url"
              value={formData.twitter_post_url}
              onChange={(e) => handleInputChange('twitter_post_url', e.target.value)}
              placeholder={t('whitelist.twitterPostPlaceholder')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instagram_post_url">{t('whitelist.instagramPost')}</Label>
            <Input
              id="instagram_post_url"
              value={formData.instagram_post_url}
              onChange={(e) => handleInputChange('instagram_post_url', e.target.value)}
              placeholder={t('whitelist.instagramPostPlaceholder')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="linkedin_post_url">{t('whitelist.linkedinPost')}</Label>
            <Input
              id="linkedin_post_url"
              value={formData.linkedin_post_url}
              onChange={(e) => handleInputChange('linkedin_post_url', e.target.value)}
              placeholder={t('whitelist.linkedinPostPlaceholder')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="other_social_url">{t('whitelist.otherSocial')}</Label>
            <Input
              id="other_social_url"
              value={formData.other_social_url}
              onChange={(e) => handleInputChange('other_social_url', e.target.value)}
              placeholder={t('whitelist.otherSocialPlaceholder')}
            />
          </div>

          {/* Mensagem LGPD */}
          <div className="bg-gray-500/10 border border-gray-500/20 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="lgpd-consent"
                required
                className="mt-1"
              />
              <label htmlFor="lgpd-consent" className="text-xs text-gray-300 leading-relaxed">
                {t('whitelist.lgpd.consent')}
              </label>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? t('whitelist.submitting') : t('whitelist.submit')}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
