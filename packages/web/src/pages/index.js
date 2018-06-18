import React from 'react'
import styled from 'styled-components'
import Button from '../components/Button'
import TopNav from '../components/TopNav'

const Aligner = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
`

const Content = styled.div`
  h1 {
    font-family: "Fira Sans";
    font-size: 2.5em;
    font-weight: 300;
    color: #fff;
    margin: auto;
    max-width: 90rem;
    text-align: center;
    line-height: 1.2em;
    padding-bottom: 1em;
    b {
      font-weight: 400;
    }
  }
  ${Button} {
    display: block;
    margin: auto;
  }
`

const Container = styled.div`

`

const Lead = styled.div`
  height: 49em;
  background-image: linear-gradient(270deg, #AE2370 10%, #C83787 90%);
`

const IndexPage = () => (
  <Container>
    <Lead>
      <Aligner>
        <Content>
          <h1>
            <b>Your</b> booking system
          </h1>
          <Button filled>
            Get started
          </Button>
        </Content>
      </Aligner>
    </Lead>
  </Container>
)

export default IndexPage
