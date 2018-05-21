import styled from 'styled-components'
import { H1 } from './BuildingBlocks'
import { Table } from './BookinTable'

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;  

  > ${H1} {
    flex-grow: 0;
    flex-shrink: 0;
  }
  > ${Table} {
    flex-grow: 1;
    flex-shrink: 1;
  }
`

export const Top = styled.div`
  padding-bottom: 2em;
  ${H1} {
    padding: 1em 2rem 0;
  }
`
