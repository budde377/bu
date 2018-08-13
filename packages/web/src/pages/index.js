import React, { Component } from 'react'
import styled from 'styled-components'
import TopNav from '../components/TopNav'
import Layout from '../components/Layout'
import bg from '../../images/dry-line.jpg'
import Scroll from '../components/Scroll'
import Button from '../components/Button'
import { Clock, SpeachBubble } from '../components/Icon'
import Avatar from '../components/Avatar'
import a1 from '../../images/avatar1.jpg'

const Container = styled.div`
  max-width: 150rem;
  margin: auto;
  ${TopNav} {
    left: 0;
    right: 0;
    position: fixed;
    top: 0;
    z-index: 100;
  }
`

const RightBox = styled.div`
  position: absolute;
  right: 0;
  top: -20em;
  box-sizing: border-box;
  padding: 1em;
  width: 45em;
  min-height: 10em;
  z-index: 10;
  background-color: #fff;
  box-shadow: 0.0625em 0.125em 0 #9a9a9a;
  >div {
    padding: 4em 2em;
    p {
      padding-top: 1em;
      max-width: 28em;
    }
  } 
  > ul {
    display: flex;
    flex-wrap: wrap;
    justify-content: stretch;
    margin-bottom: -2em;
    li {
      position: relative;
      box-sizing: border-box;
      padding: 2em;
      height: 20em;
      margin-bottom: 2em;
      flex-basis: 19.5em;
      flex-grow: 1;
      align-content: stretch;
      border: 0.0625em none #BD4C8B;
      &:last-of-type {
        border-style: dashed;
      }
      p {
        padding-top: 1.5em;
      }
      ${Button} {
        position: absolute;
        bottom: 2em;
        left: 2em;
      }
    }
  }
`

const Content = styled.div`
  max-width: 88em;
  margin: auto;
  box-sizing: border-box;
`

const Leader = styled.div`
  background-image: url(${bg});
  height: 100vh;
  max-height: 70rem;
  background-position: center center;
  background-size: cover;
  position: relative;
  h1 {
    font-family: "Fira Sans", sans-serif;
    font-weight: 700;
    color: #fff;
    font-size: 2.5em;
    line-height: 1.45em;
  }
  ${Content} {
    max-height: 42rem;
    height: 60vh;
    position: relative;
    > div {
      position: absolute;
      bottom: 0;
      left: 1em;
    }
  }
  
`

const Skewer = styled.div`
  background-color: ${({ dark }) => dark ? '#EEEEEE' : '#F5F5F5'};
  transform: skew(0, -5deg);
  transform-origin: top left;
  height: 100%;
  width: 100%;
  top: 0;
  bottom: 0;
  position: absolute;
`

const Section = styled.div`
  position: relative;
  ${Content} {
    position: relative;
    min-height: 20em;
  }
`

const Setup = styled.div`
  padding: 14em 1em 16em;
  h2 {
  }
  p {
    max-width: 28em;
    padding-top: 1em;
    &:last-of-type {
      padding-bottom: 3em;
    }
  }
`
const Testimonials = styled.div`
  padding: 10em 0 20em;
  text-align: center;
  ul {
    padding-top: 5em;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    li {
      flex-basis: 20em;
      text-align: left;
      font-weight: 400;
      font-style: italic;
    }
  }
`

const Profile = styled.div`
  font-weight: 300;
  font-style: normal;
  padding: 4em 0 0 0;
  position: relative;
  ${Avatar} {
    position: absolute;
    bottom: 0;
    right: 0;
  } 
`

const Price = styled(props => (
  <div {...props}>
    <span>
    $0
    </span>
    <span>
      /mo
    </span>
  </div>
))`
  height: 5em;
  position: relative;
  span:first-of-type{
    font-weight: 400;
    font-family: "Fira Sans", sans-serif;
    color: #494949;
    text-align: center;
    font-size: 4em;
    line-height: 1.25em;
    display: block;
  }
  span:last-of-type{
    position: absolute;
    right: 0;
    bottom: 0;
    height: 1.5em;
    line-height: 1.5em;
    font-size: 2.125em;
    color: #909090;
    font-weight: 400;
    font-family: "Fira Sans", sans-serif;
  }

`

const Pricing = styled.div`
  padding: 10em 0 20em;
  text-align: center;
  ul {
    text-align: left;
    display: flex;
    justify-content: space-between;
    max-width: 55.125em;
    margin: auto;
    padding-top: 5em;
    align-items: stretch;
    li {
      padding-bottom: 6.5em;
      position:relative;
      flex-basis: 16.6em;
      border: 0.0625em solid #AE2370;
      h3 {
        text-align: center;
        height: 3em;
        line-height: 3em;
        font-family: "Fira Sans", sans-serif;
        font-weight: 400;
        color: #fff;
        font-size: 1.125em;
        text-transform: uppercase;
        background-color: #AE2370;
      }    
      p {
        padding: 1.5em 1em;
      }  
      ${Button} {
        position: absolute;
        bottom: 1.5em;
        left: 1em;
        width: calc(100% - 2em);
      }
      ${Price} {
        position: absolute;
        bottom: 1em;
        left: 1em;
        right: 1em;
      }
    }
  }
`

class IndexPage extends Component {
  state = { scrolling: false }
  _scrolling = false
  _f = () => {
    const scrolling = !!window.scrollY
    if (scrolling === this._scrolling) {
      return
    }
    this.setState({ scrolling })
    this._scrolling = scrolling
  }

  render () {
    return (
      <Layout>
        <Scroll f={this._f} />
        <Container>
          <TopNav floating={this.state.scrolling} />
          <Leader>
            <Content>
              <div>
                <h1>
                  A booking system for your<br />
                  washing machine
                </h1>
              </div>
            </Content>
          </Leader>
          <Section>
            <Skewer />
            <Content>
              <RightBox>
                <div>
                  <h2>
                    Let people book your stuff
                  </h2>
                  <p>
                    Whether it’s a parking spot, washing machine, office hours, conference rooms, thang is the system
                    for
                    you!
                  </p>
                  <p>
                    Booking doesn’t have to be more complicated than that!
                  </p>
                </div>
                <ul>
                  <li>
                    <h3>Washing machines</h3>
                    <p>
                      Are you sharing your washing machine with your neighbours and tired of never knowing when it’ll be
                      available?
                    </p>
                    <Button>Learn more</Button>
                  </li>
                  <li>
                    <h3>Parking lots</h3>
                    <p>
                      Do you have a parking lot that’s shared among multiple tenants?
                    </p>
                    <Button>Learn more</Button>
                  </li>
                  <li>
                    <h3>Conference rooms</h3>
                    <p>
                      Do you have a conference room at your workplace that never seems to be available?
                    </p>
                    <Button>Learn more</Button>
                  </li>
                  <li>
                    <h3>Something else?</h3>
                    <p>
                      Wan’t to know more about the general functionality of thang to see if we fit your case?
                    </p>
                    <Button>Learn more</Button>
                  </li>
                </ul>
              </RightBox>
              <Setup>
                <h2>
                  <Clock />
                  Setup in minutes
                </h2>
                <p>
                  Whether it’s a parking spot, washing machine, office hours, conference rooms, thang is the system for
                  you!
                </p>
                <p>
                  Booking doesn’t have to be more complicated than that!
                </p>
                <Button>Setup now</Button>
              </Setup>
            </Content>
            <Section>
              <Skewer dark />
              <Content>
                <Testimonials>
                  <h2>
                    Here's what our users have to say
                  </h2>
                  <ul>
                    <li>
                      This is maybe the best booking tool ever! Much better than stupid Laundree.
                      <Profile>
                        Bob Carlsen,<br />
                        Aabenraa, Denmark
                        <Avatar src={a1} />
                      </Profile>
                    </li>
                    <li>
                      I never knew that I needed a booking tool before I tried Thang. This tool allows you to literally
                      book anything!
                      <Profile>
                        Bob Carlsen,<br />
                        Aabenraa, Denmark
                        <Avatar src={a1} />
                      </Profile>
                    </li>
                    <li>
                      This is maybe the best booking tool ever! Much better than stupid Laundree.
                      <Profile>
                        Bob Carlsen,<br />
                        Aabenraa, Denmark
                        <Avatar src={a1} />
                      </Profile>
                    </li>
                  </ul>
                </Testimonials>
              </Content>
              <Section>
                <Skewer />
                <Content>
                  <Pricing>
                    <h2>
                      Pricing
                    </h2>
                    <ul>
                      <li>
                        <h3>
                          Individual
                        </h3>
                        <p>
                          Thang is absolutely free for individuals. Still feel the need to contribute? Learn how you can
                          help us keep the servers running here.
                        </p>
                        <Price />
                      </li>
                      <li>
                        <h3>
                          Business
                        </h3>
                        <p>
                          Are you using Thang at your business? Please contact us for a quote.
                        </p>
                        <Button>
                          Contact us
                        </Button>
                      </li>
                      <li>
                        <h3>
                          Developer
                        </h3>
                        <p>
                          Integrate Thang onto your existing site with our API. Please contact us for more information.
                        </p>
                        <Button>
                          Get access
                        </Button>
                      </li>
                    </ul>
                  </Pricing>
                </Content>
              </Section>
            </Section>
          </Section>
        </Container>
      </Layout>
    )
  }
}

export default IndexPage
