import React from 'react';
import { useRouter } from 'next/router';
import ListaArea from './list';

const Areas = () => {
  const router = useRouter();
  const { path } = router.query;

  const renderComponent = () => {

      return <ListaArea />; // Renderiza ListaArea por defecto
  };

  return (
    <div>
      {renderComponent()}
    </div>
  );
};

export default Areas;
