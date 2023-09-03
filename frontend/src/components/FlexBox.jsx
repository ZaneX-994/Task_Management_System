import styled from '@emotion/styled';
import { Box } from '@mui/material';
import React from 'react';

export const RowBox = styled(FlexBox)(
  {
    flexDirection: 'row'
  }
)

export const ColumnBox = styled(FlexBox)(
  {
    flexDirection: 'column'
  }
)

export default function FlexBox (props) {
  return (
      <Box display='flex' {...props}>
          {props.children}
      </Box>
  )
}
