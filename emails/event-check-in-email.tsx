import { Body, Container, Head, Heading, Html, Img, Preview, Section, Text } from "@react-email/components"

interface EventCheckInEmailProps {
  formName: string
  userName?: string
  checkInTime?: string
  additionalInfo?: string
}

export default function EventCheckInEmail({
  formName,
  userName = "there",
  checkInTime = new Date().toLocaleString(),
  additionalInfo = "",
}: EventCheckInEmailProps) {
  const previewText = `Check-in Confirmation: ${formName}`

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logo}>
            <Img src={`${process.env.NEXT_PUBLIC_APP_URL}/logo.png`} alt="Logo" width="64" height="64" />
          </Section>
          <Heading style={heading}>Check-in Successful!</Heading>
          <Text style={paragraph}>Hi {userName},</Text>
          <Text style={paragraph}>
            You have successfully checked in to <strong>{formName}</strong>.
          </Text>

          <Section style={eventDetails}>
            <Text style={eventInfo}>Check-in Time: {checkInTime}</Text>
            {additionalInfo && <Text style={paragraph}>{additionalInfo}</Text>}
          </Section>

          <Section style={footerSection}>
            <Text style={footer}>Thank you for attending our event!</Text>
            <Text style={footer}>© {new Date().getFullYear()} Orionis. All rights reserved.</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const main = {
  backgroundColor: "#f5f5f5",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
}

const container = {
  margin: "0 auto",
  padding: "32px",
  backgroundColor: "#ffffff",
  maxWidth: "600px",
}

const logo = {
  marginBottom: "24px",
  textAlign: "center" as const,
}

const heading = {
  fontSize: "24px",
  fontWeight: "bold",
  textAlign: "center" as const,
  margin: "16px 0",
  color: "#333",
}

const paragraph = {
  fontSize: "16px",
  lineHeight: "24px",
  color: "#333",
  margin: "16px 0",
}

const eventDetails = {
  backgroundColor: "#f9f9f9",
  padding: "16px",
  borderRadius: "4px",
  margin: "24px 0",
}

const eventInfo = {
  fontSize: "15px",
  lineHeight: "22px",
  margin: "4px 0",
  color: "#555",
}

const footerSection = {
  marginTop: "32px",
  borderTop: "1px solid #eee",
  paddingTop: "16px",
}

const footer = {
  fontSize: "13px",
  lineHeight: "20px",
  color: "#777",
  textAlign: "center" as const,
  margin: "4px 0",
}
