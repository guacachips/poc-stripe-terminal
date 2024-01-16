'use client';

import { useState } from 'react';
import { TagsList } from '@/ui/tags-list';
import { Button } from '@/ui/button';
import { InputText } from '@/ui/input-text';
import {
  cancelActionOnReader,
  createPaymentIntent,
  processPaymentIntent,
} from '@/stripe-server';

export function SectionSendPaymentRequestToTerminal() {
  const tags = ['Stripe', 'Payment'];

  return (
    <section className='bg-white dark:bg-transparent rounded-lg p-4 border border-violet-500 flex flex-col gap-4'>
      <header className='flex flex-row justify-between items-center'>
        <div>
          <TagsList labels={tags} />
        </div>
      </header>

      <div>
        <Form />
      </div>
    </section>
  );
}

function Form() {
  const [amount, setAmount] = useState(0);
  const [isReaderBusy, setIsReaderBusy] = useState(false);
  const readerId = 'tmr_FaOk9QQmYa6bnu';

  const actionCreatePaymentIntent = async (amount: number) => {
    try {
      const cents = amount * 100;
      const destination = 'acct_1OZFm0AjiEy1bJp6'; // Stripe connect account ID (this one is linked to Guaca Shop account)
      const fee = cents * 0.15;
      const paymentIntent = await createPaymentIntent({
        amount: cents,
        stripeAccountDestinationTransfer: destination,
        fee,
      });

      if (!paymentIntent) {
        console.error(`Something went wrong while creating a payment intent`);
      }

      return paymentIntent;
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  const actionProcessPaymentIntent = async (paymentIntentId: string) => {
    try {
      const reader = await processPaymentIntent({
        readerId,
        paymentIntentId,
      });

      if (!reader) {
        console.error(
          `Something went wrong while processing payment ${paymentIntentId} with reader ${readerId}`
        );
      }

      console.debug(
        `Payment Intent ${paymentIntentId} processed: ${JSON.stringify(reader)}`
      );
      return reader;
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  const callback = async (onComplete: () => void) => {
    try {
      setIsReaderBusy(true);
      const paymentIntent = await actionCreatePaymentIntent(amount);

      if (!paymentIntent) {
        console.error(`Something went wrong while creating payment intent`);
        onComplete();
        return;
      }

      const reader = await actionProcessPaymentIntent(paymentIntent.id);
      onComplete();

      console.debug(
        `Payment Intent ${paymentIntent.id} processed: ${JSON.stringify(
          reader
        )}`
      );
    } catch (error) {
      onComplete();
      console.error(error);
    }
  };

  if (isReaderBusy) {
    const callback = async () => {
      await cancelActionOnReader({ readerId });
      setIsReaderBusy(false);
    };

    return (
      <div className='flex flex-col gap-4'>
        <div className='flex flex-col gap-4 py-4 text-center'>
          <p className='text-slate-400 text-lg'>Total</p>
          <p className='text-3xl font-semibold text-slate-100'>CA${amount}</p>
          <p className='text-slate-400 text-sm'>
            Please give the terminal reader to your customer so they can make
            the payment.
          </p>
        </div>
        <div className='flex flex-row justify-end'>
          <button
            className='text-red-400 rounded-lg uppercase text-sm cursor-pointer text-right'
            onClick={callback}
          >
            Cancel transaction
          </button>
        </div>
      </div>
    );
  }

  return (
    <form className='flex flex-col gap-4'>
      <div className='flex'>
        <span className='inline-flex font-semibold items-center px-3 text-sm text-gray-900 bg-gray-200 border rounded-e-0 border-gray-300 rounded-s-md dark:bg-gray-600 dark:text-gray-400 dark:border-white border-r-none'>
          $
        </span>
        <InputText
          placeholder='Amount'
          type='number'
          className='rounded-l-none border-l-none'
          onChangeValue={(value) => setAmount(+value)}
        />
      </div>
      <Button callback={callback}>Request payment</Button>
    </form>
  );
}
