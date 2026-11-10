"use client"

import React, { useEffect } from 'react';
import { EmploymentDetailsForm } from '@/components/Dashboard/Details/details';
import { useSession } from 'next-auth/react';
import { useEmploymentDetailsStore } from '@/utils/employmentDetailtsStore';
import { useEmploymentDetails } from '@/hooks/details/useEmploymentDetailts';

const DetailsPage = () => {
  const { data: session, status } = useSession();
  const userId = session?.user?.id;

  const {
    details,
  } = useEmploymentDetails(status === "authenticated" ? userId : undefined);
  return (
    <div className='flex-1 overflow-y-auto p-4'>
      <EmploymentDetailsForm userId={userId} initialData={details ?? undefined} />
    </div>
  );
};

export default DetailsPage;
