// @flow
import React from 'react'
import ReactDOM from 'react-dom'
import { ModalContainer, ModalBackdrop, Modal as ModalStyle } from './styled/Modal'

export default class Modal extends React.Component<{ children: *, show: boolean, onClose: () => mixed }, { element: ?HTMLDivElement }> {
  state = {element: null}
  _modalRoot: ?HTMLElement

  componentDidMount () {
    const modalRoot = document.getElementById('modal-root')
    if (!modalRoot) {
      console.warn('No element with id #modal-root was found.')
      return
    }
    this._modalRoot = modalRoot
    const element = document.createElement('div')
    modalRoot.appendChild(element)
    this.setState({element})
  }

  componentWillUnmount () {
    if (!this.state.element || !this._modalRoot) {
      return
    }
    this._modalRoot.removeChild(this.state.element)
  }

  render () {
    if (!this.state.element) {
      return null
    }
    return ReactDOM.createPortal(
      <ModalContainer show={this.props.show}>
        <ModalBackdrop onClick={this.props.onClose} />
        <ModalStyle>
          {this.props.children}
        </ModalStyle>
      </ModalContainer>,
      this.state.element
    )
  }
}
