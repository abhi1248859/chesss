'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmPayment: () => void;
}

const UPI_ID = '7574814676@ybl';
const PAYEE_NAME = 'Abhi';
const AMOUNT = 10;

const upiLink = `upi://pay?pa=${UPI_ID}&pn=${PAYEE_NAME}&am=${AMOUNT}&cu=INR`;
const qrImageUrl = `https://chart.googleapis.com/chart?cht=qr&chs=250x250&chl=${encodeURIComponent(upiLink)}`;

export default function PaymentDialog({ open, onOpenChange, onConfirmPayment }: PaymentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Unlock Premium Difficulty</DialogTitle>
          <DialogDescription>
            To unlock difficulty levels above 50, please make a payment of ₹{AMOUNT}.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center gap-4 py-4">
          <p className="text-sm text-muted-foreground">Scan the QR code with any UPI app</p>
          <div className="p-4 bg-white rounded-lg">
             <Image
                src={qrImageUrl}
                alt="UPI QR Code for Payment"
                width={200}
                height={200}
                data-ai-hint="qr code"
             />
          </div>
          <p className="font-semibold text-center">
            Or pay to UPI ID:<br />
            <span className="font-mono text-accent">{UPI_ID}</span>
          </p>
        </div>
        <DialogFooter className='sm:justify-center'>
          <Button type="button" onClick={onConfirmPayment} className="w-full">
            I Have Paid ₹{AMOUNT}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
