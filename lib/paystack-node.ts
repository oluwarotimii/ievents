export default class Paystack {
    private secretKey: string
    private baseUrl = "https://api.paystack.co"
  
    constructor(secretKey: string) {
      this.secretKey = secretKey
    }
  
    async initializeTransaction(data: {
      email: string
      amount: number
      reference: string
      callback_url: string
      metadata?: any
    }) {
      try {
        console.log("Initializing Paystack transaction with data:", {
          email: data.email,
          amount: data.amount / 100, // Log in naira for readability
          reference: data.reference,
          callback_url: data.callback_url,
        })
  
        const response = await fetch(`${this.baseUrl}/transaction/initialize`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        })
  
        if (!response.ok) {
          const errorText = await response.text()
          console.error("Paystack API error:", errorText)
          throw new Error(`Paystack API error: ${response.status} ${errorText}`)
        }
  
        const result = await response.json()
        console.log("Paystack initialization successful:", result)
  
        return result
      } catch (error) {
        console.error("Error in Paystack.initializeTransaction:", error)
        throw error
      }
    }
  
    async verifyTransaction(reference: string) {
      try {
        console.log(`Verifying Paystack transaction with reference: ${reference}`)
  
        const response = await fetch(`${this.baseUrl}/transaction/verify/${reference}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            "Content-Type": "application/json",
          },
        })
  
        if (!response.ok) {
          const errorText = await response.text()
          console.error("Paystack verification API error:", errorText)
          throw new Error(`Paystack API error: ${response.status} ${errorText}`)
        }
  
        const result = await response.json()
        console.log("Paystack verification result:", result)
  
        return result
      } catch (error) {
        console.error("Error in Paystack.verifyTransaction:", error)
        throw error
      }
    }
  }
  