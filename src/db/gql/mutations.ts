import { gql } from 'graphql-request';

export const INSERT_USER_MUTATION = gql`
  mutation NewUserMutation($vk_id: numeric, $full_name: String) {
    insert_Users_one(object: { vk_id: $vk_id, full_name: $full_name }) {
      id
      full_name
    }
  }
`;

// pk_columns: { id: $id }
export const LOG_USAGE_MUTATION = gql`
  mutation LogUsage(
    $prompt_tokens: Int
    $total_tokens: Int
    $completion_tokens: Int
    $id: numeric!
    $last_gpt_message_id: String
  ) {
    update_Users_by_pk(
      pk_columns: { id: $id }
      _inc: {
        count: 1
        prompt_tokens: $prompt_tokens
        total_tokens: $total_tokens
        completion_tokens: $completion_tokens
      }
      _set: { last_gpt_message_id: $last_gpt_message_id }
    ) {
      id
    }
  }
`;
// postgres://postgres:16kkxSyH0HP39KYq@db.votsmqntfgnoqohrccmk.supabase.co:5432/postgres
