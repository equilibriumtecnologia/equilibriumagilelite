/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Confirme seu e-mail para o Agile Lite</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Img
            src="https://oteqziddtpjosoacjfwq.supabase.co/storage/v1/object/public/email-assets/logo.png"
            alt="Agile Lite"
            width="48"
            height="48"
            style={logo}
          />
        </Section>
        <Heading style={h1}>Confirme seu e-mail</Heading>
        <Text style={text}>
          Obrigado por se cadastrar no{' '}
          <Link href={siteUrl} style={link}>
            <strong>Agile Lite</strong>
          </Link>
          ! 🎉
        </Text>
        <Text style={text}>
          Confirme seu endereço de e-mail (
          <Link href={`mailto:${recipient}`} style={link}>
            {recipient}
          </Link>
          ) clicando no botão abaixo:
        </Text>
        <Section style={buttonSection}>
          <Button style={button} href={confirmationUrl}>
            Verificar E-mail
          </Button>
        </Section>
        <Text style={footer}>
          Se você não criou uma conta, pode ignorar este e-mail com segurança.
        </Text>
        <Text style={brand}>© 2025 Agile Lite — Equilibrium Tecnologia</Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = { backgroundColor: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }
const container = { padding: '40px 25px 30px' }
const logoSection = { textAlign: 'center' as const, marginBottom: '24px' }
const logo = { display: 'inline-block', borderRadius: '12px' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#001024', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#555d6e', lineHeight: '1.6', margin: '0 0 20px' }
const link = { color: 'hsl(256, 100%, 54%)', textDecoration: 'underline' }
const buttonSection = { textAlign: 'center' as const, margin: '32px 0' }
const button = {
  backgroundColor: 'hsl(256, 100%, 54%)',
  color: '#f7f7f7',
  fontSize: '16px',
  fontWeight: '600' as const,
  borderRadius: '12px',
  padding: '14px 32px',
  textDecoration: 'none',
}
const footer = { fontSize: '13px', color: '#999999', margin: '30px 0 8px', lineHeight: '1.5' }
const brand = { fontSize: '11px', color: '#bbbbbb', margin: '0', textAlign: 'center' as const }
