-- AlterTable
ALTER TABLE "payment_settings" ADD COLUMN     "split_percentage" INTEGER NOT NULL DEFAULT 98;

-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN     "next_payment_date" TIMESTAMPTZ,
ADD COLUMN     "paystack_plan_id" TEXT,
ADD COLUMN     "paystack_subscription_code" TEXT;

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "payment_date" TIMESTAMPTZ,
ADD COLUMN     "platform_fee" DOUBLE PRECISION,
ADD COLUMN     "split_amount" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "paystack_customer_code" TEXT;
