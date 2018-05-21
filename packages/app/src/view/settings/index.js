// @flow

import React from 'react'
import { H1, H2, Section, Text } from '../styled/BuildingBlocks'
import { Content, SecondaryContent } from '../styled/Menu'
import { FormattedMessage } from 'react-intl'
import { Email, Key, Time, Trash } from '../styled/Icon'

export default () => (
  <Content>
    <SecondaryContent>
      <H1>
        <FormattedMessage id={'Settings.header'} />
      </H1>
      <Text>
        <FormattedMessage id={'Settings.text'} />
      </Text>
      <Section>
        <H2>
          <Email /> <FormattedMessage id={'Settings.emailVerification.header'} />
        </H2>
        <Text>
          <FormattedMessage id={'Settings.emailVerification.message'} />
        </Text>
      </Section>
      <Section>
        <H2>
          <Key />
          <FormattedMessage id={'Settings.changePassword.header'} />
        </H2>
        <Text>
          <FormattedMessage id={'Settings.changePassword.message'} />
        </Text>
      </Section>
      <Section>
        <H2>
          <Time />
          <FormattedMessage id={'Settings.changeTimezone.header'} />
        </H2>
        <Text>
          <FormattedMessage id={'Settings.changeTimezone.message'} />
        </Text>
      </Section>
      <Section red>
        <H2>
          <Trash />
          <FormattedMessage id={'Settings.deleteAccount.header'} />
        </H2>
        <Text>
          <FormattedMessage id={'Settings.deleteAccount.message'} />
        </Text>
      </Section>
    </SecondaryContent>
  </Content>
)
