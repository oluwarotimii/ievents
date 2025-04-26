class Paystack {
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
          throw new Error(`Paystack API error: ${response.status} ${errorText}`)
        }
  
        const result = await response.json()
        return result
      } catch (error) {
        console.error("Error in Paystack.initializeTransaction:", error)
        throw error
      }
    }
  
    async verifyTransaction(reference: string) {
      try {
        const response = await fetch(`${this.baseUrl}/transaction/verify/${reference}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            "Content-Type": "application/json",
          },
        })
  
        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Paystack API error: ${response.status} ${errorText}`)
        }
  
        const result = await response.json()
        return result
      } catch (error) {
        console.error("Error in Paystack.verifyTransaction:", error)
        throw error
      }
    }
  }
  
  export default Paystack
  