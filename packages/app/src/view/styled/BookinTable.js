// @flow

import styled from 'styled-components'
import { Avatar } from './User'

export const Table = styled.div`
  overflow: hidden;
  display: flex;

  flex-direction: column;
  align-content: stretch;
`

export const Row = styled.div`
  display: flex;
  flex-direction: row;
`

export const HeaderCell = styled.div`
  background-color: ${({today}) => today ? '#f5a500' : '#FFB213'};
  color: #fff;
  text-align: center;
  line-height: 2em;
  padding: 0.25em 0;
  font-weight: normal;
  flex-grow: 1;
  flex-shrink: 1;
`

export const Header = styled.div`
  flex-grow: 0;
  background-color: #ffda95;
  flex-shrink: 0;
  ${HeaderCell}:first-of-type {
    width: 3em;
    background-color: transparent;
    flex-grow: 0;
    flex-shrink: 0;
  }
  ${HeaderCell}:not(:first-of-type) {
    flex-basis: 0;
  }
  ${HeaderCell}:last-of-type {
    margin-right: 0.5em;
  }
`

export const HeaderTable = styled.div`
  width: 100%;
  border-spacing: 0.1em;
  border-collapse: separate;
  margin-top: 1em;
  overflow: hidden;
  ${HeaderCell}:first-of-type {
    width: 3em;
    opacity: 0.5;
    flex-grow: 0;
    flex-shrink: 0;
  }

`

export const TableScroll = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow-y: scroll;
  margin-bottom: -1em;
  &::-webkit-scrollbar {
    width: 0.5em;
  }
  &::-webkit-scrollbar-thumb {
    border-radius: 0.1em;
    background-color: #e5e5e5;
  }
  &::-webkit-scrollbar-track {
    background-color: #fff;
  }
`

export const Time = styled.div`
`

export const FauxCheck = styled.div`
    width: 1em;
    height: 1em;
    background-color: #fff;
    border-radius: 0.1em;
    border: 0.1em solid #dedede;
    transition: 0.1s border-color;

`

export const TimeCell = styled.div`
  text-align: right;
  position: relative;
  width: 3em;
  ${Time} {
    width: 100%;
    left: 0;
    bottom: -1em;
    height: 2em;
    text-transform: uppercase;
    line-height: 2em;
    color: #868686;
    text-align: center;
    font-family: "Lato", sans-serif;
    font-size: 0.8em;
    position: absolute;
  }
`

function backgroundColor ({percent, owner, me}) {
  if (percent) {
    return '#f3f3f3'
  }
  if (owner === me) {
    return '#ff909a'
  }
  if (owner) {
    return '#7fcdd7'
  }
  return '#e5e5e5'
}

export const Cell = styled.div`
  flex-grow: 1;
  background-color: ${backgroundColor};
  flex-shrink: 1;
  text-align: center;
  height: 3em;
  flex-basis: 0;
  cursor: pointer;
  position: relative;
  &:before {
    display: block;
    position: absolute;
    top: -0.01em;
    z-index: 1;
    background-color: rgba(255,167,23,0.5);
    left: 0;
    right: 0;
    content: '';
    height: ${({percent}) => (percent * 3)}em;
  }
  ${Avatar} {
    height: 2em;
    width: 2em;
    position: absolute;
    border-radius: 1em;
    border: 0.1em solid transparent;
    border-color: ${props => props.owner ? '#fff ' : 'transparent'};
    top: 0.4em;
    left: 50%;
    margin-left: -1.1em;
  }
  ${FauxCheck} {
    position: absolute;
    top: 0.9em;
    left: 50%;
    margin-left: -0.6em;
  }
  &:hover ${FauxCheck} {
    ${({percent}) => percent ? '' : 'border-color: #b7b7b7;'}
  }

`

export const InterCell = styled.div`
  border: 0.01em solid #fff;
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
`

export const Body = styled.div`
  flex-grow: 1;
  flex-shrink: 1;
  position: relative;
`
