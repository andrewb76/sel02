import { gql } from 'graphql-request';

export const FIND_USER_QUERY = gql`
  query FindUserQuery($vk_id: numeric) {
    Users(where: { vk_id: { _eq: $vk_id } }) {
      id
      vk_id
      full_name
      last_gpt_message_id
    }
  }`;

