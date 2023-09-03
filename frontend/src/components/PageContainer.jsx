import ContainerMUI from '@mui/material/Container';
import React from 'react';
import styled from '@emotion/styled';
import { Box } from '@mui/material';

const EditContainer = styled(ContainerMUI)(({ marginTop }) => ({
  borderRadius: '20px',
  backgroundColor: 'white',
  padding: '40px',
  boxShadow:
    '0px 3px 3px -2px rgba(0,0,0,0.2), 0px 3px 4px 0px rgba(0,0,0,0.14), 0px 1px 8px 0px rgba(0,0,0,0.12)',
}));

export default function PageContainer(props) {
  const { marginTop, children, ...restProps } = props;

  return (
    <Box padding='10px'>
      <EditContainer style={{marginTop: marginTop || '0px'}} {...restProps} elevation={3}>
        {children}
      </EditContainer>
    </Box>
  );
}
