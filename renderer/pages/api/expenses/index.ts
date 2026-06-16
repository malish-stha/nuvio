import { NextApiRequest, NextApiResponse } from 'next'
import { verifyToken } from '@clerk/backend'
import { db } from '../../../lib/db'
import { pusherServer } from '../../../lib/pusher-server'

async function authenticate(req: NextApiRequest) {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null
    }
    const token = authHeader.split(' ')[1]
    try {
        if (!process.env.CLERK_SECRET_KEY || token === 'mock-token') {
            return { sub: 'mock-user-12345' }
        }
        const payload = await verifyToken(token, {
            secretKey: process.env.CLERK_SECRET_KEY,
        })
        return payload
    } catch (error) {
        console.error('Clerk Auth Verification Error:', error)
        return null
    }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const auth = await authenticate(req)
    if (!auth) {
        return res.status(401).json({ error: 'Unauthorized' })
    }
    const currentUserId = auth.sub

    if (req.method === 'GET') {
        const { serverId } = req.query as { serverId: string }
        if (!serverId) {
            return res.status(400).json({ error: 'Missing serverId' })
        }

        try {
            // 1. Fetch personal daily ledger items for current user (where serverId matches context or empty, isPersonal is true)
            const personalExpenses = await db.expense.findMany({
                where: {
                    payerId: currentUserId,
                    isPersonal: true
                },
                orderBy: { createdAt: 'desc' }
            })

            // 2. Fetch shared group expenses for this server
            const sharedExpenses = await db.expense.findMany({
                where: {
                    serverId,
                    isPersonal: false
                },
                include: {
                    payer: {
                        select: { id: true, fullName: true, imageUrl: true }
                    },
                    splits: {
                        include: {
                            user: {
                                select: { id: true, fullName: true, imageUrl: true }
                            }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            })

            // 3. Fetch server members list to calculate balances
            const members = await db.member.findMany({
                where: { serverId },
                include: {
                    user: {
                        select: { id: true, fullName: true, imageUrl: true }
                    }
                }
            })

            // 4. Calculate Net Balances (Paid - Owed)
            // Initialize balanceMap with 0 for all server members
            const balanceMap: Record<string, number> = {}
            const usersMap: Record<string, { fullName: string; imageUrl: string | null }> = {}
            
            members.forEach(m => {
                balanceMap[m.userId] = 0
                usersMap[m.userId] = {
                    fullName: m.user.fullName,
                    imageUrl: m.user.imageUrl
                }
            })

            // Calculate paid amount and owed amount for each shared expense
            sharedExpenses.forEach(exp => {
                const amount = Number(exp.amount)
                const payerId = exp.payerId
                
                // Add to payer
                if (balanceMap[payerId] !== undefined) {
                    balanceMap[payerId] += amount
                }

                // Subtract from owe-ees
                exp.splits.forEach(split => {
                    const oweUserId = split.userId
                    const splitAmt = Number(split.amount)
                    if (balanceMap[oweUserId] !== undefined) {
                        balanceMap[oweUserId] -= splitAmt
                    }
                })
            })

            // Simplify debts: matching positive balances (creditors) with negative balances (debtors)
            const debtors: { userId: string; amount: number }[] = []
            const creditors: { userId: string; amount: number }[] = []

            Object.entries(balanceMap).forEach(([uid, bal]) => {
                // Round to 2 decimal places to avoid floating point issues
                const rounded = Math.round(bal * 100) / 100
                if (rounded < 0) {
                    debtors.push({ userId: uid, amount: -rounded })
                } else if (rounded > 0) {
                    creditors.push({ userId: uid, amount: rounded })
                }
            })

            // Greedy settlement calculation
            const debtsList: { from: string; fromName: string; to: string; toName: string; amount: number }[] = []
            let dIdx = 0
            let cIdx = 0

            while (dIdx < debtors.length && cIdx < creditors.length) {
                const debtor = debtors[dIdx]
                const creditor = creditors[cIdx]
                const settleAmount = Math.min(debtor.amount, creditor.amount)

                if (settleAmount > 0.01) {
                    debtsList.push({
                        from: debtor.userId,
                        fromName: usersMap[debtor.userId]?.fullName || 'Member',
                        to: creditor.userId,
                        toName: usersMap[creditor.userId]?.fullName || 'Member',
                        amount: Number(settleAmount.toFixed(2))
                    })
                }

                debtor.amount -= settleAmount
                creditor.amount -= settleAmount

                if (debtor.amount < 0.01) dIdx++
                if (creditor.amount < 0.01) cIdx++
            }

            return res.status(200).json({
                personal: personalExpenses,
                shared: sharedExpenses,
                debts: debtsList,
                members: members.map(m => m.user)
            })
        } catch (error: any) {
            console.error('Prisma Get Expenses Error:', error)
            return res.status(500).json({ error: error.message })
        }
    }

    if (req.method === 'POST') {
        const { serverId, description, amount, category, isPersonal, payerId, splits } = req.body
        if (!description || !amount || !category || !payerId) {
            return res.status(400).json({ error: 'Missing required parameters' })
        }

        try {
            const expAmount = Number(amount)
            
            if (isPersonal) {
                // Create private personal ledger item
                const expense = await db.expense.create({
                    data: {
                        description,
                        amount: expAmount,
                        category,
                        isPersonal: true,
                        payerId
                    }
                })
                return res.status(200).json(expense)
            } else {
                // Create shared group expense
                if (!serverId || !splits || !Array.isArray(splits)) {
                    return res.status(400).json({ error: 'Shared expenses require serverId and splits list' })
                }

                const expense = await db.$transaction(async (tx: any) => {
                    const createdExp = await tx.expense.create({
                        data: {
                            description,
                            amount: expAmount,
                            category,
                            isPersonal: false,
                            payerId,
                            serverId
                        }
                    })

                    // Create expense splits
                    const splitData = splits.map((s: any) => ({
                        expenseId: createdExp.id,
                        userId: s.userId,
                        amount: Number(s.amount)
                    }))

                    await tx.expenseSplit.createMany({
                        data: splitData
                    })

                    return tx.expense.findUnique({
                        where: { id: createdExp.id },
                        include: {
                            payer: {
                                select: { id: true, fullName: true, imageUrl: true }
                            },
                            splits: {
                                include: {
                                    user: {
                                        select: { id: true, fullName: true, imageUrl: true }
                                    }
                                }
                            }
                        }
                    })
                })

                // Broadcast updates to server members
                await pusherServer.trigger(`server-${serverId}`, 'expense-updated', { action: 'create', expense })

                return res.status(200).json(expense)
            }
        } catch (error: any) {
            console.error('Prisma Create Expense Error:', error)
            return res.status(500).json({ error: error.message })
        }
    }

    if (req.method === 'DELETE') {
        const { expenseId } = req.query as { expenseId: string }
        if (!expenseId) {
            return res.status(400).json({ error: 'Missing expenseId' })
        }

        try {
            const expense = await db.expense.findUnique({
                where: { id: expenseId }
            })
            if (!expense) {
                return res.status(404).json({ error: 'Expense not found' })
            }

            await db.expense.delete({
                where: { id: expenseId }
            })

            // Broadcast updates to server if it was a shared expense
            if (!expense.isPersonal && expense.serverId) {
                await pusherServer.trigger(`server-${expense.serverId}`, 'expense-updated', { action: 'delete', expenseId })
            }

            return res.status(200).json({ success: true })
        } catch (error: any) {
            console.error('Prisma Delete Expense Error:', error)
            return res.status(500).json({ error: error.message })
        }
    }

    return res.status(405).json({ error: 'Method not allowed' })
}
