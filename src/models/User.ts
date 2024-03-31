import { queryWrapper } from "../database";

export class User {
  pubkey: string;
  name: string;
  mint_url: string;

  constructor(pubkey: string, name: string, mint_url: string) {
    this.name = name;
    this.pubkey = pubkey;
    this.mint_url = mint_url;
  }

  static async upsertUsernameByPubkey(pubkey: string, username: string) {
    const query = `
INSERT INTO l_users (pubkey, mint_url, name)
VALUES ($1, $2, $3)
ON CONFLICT (pubkey)
DO UPDATE SET name = $3
WHERE l_users.name IS NULL;`;
    const params = [pubkey, process.env.MINTURL, username];
    const queryRes = await queryWrapper(query, params);
    if (queryRes.rowCount === 0) {
      throw new Error("Did not update username");
    }
  }

  static async checkIfAliasExists(username: string) {
    const query = `
SELECT * from l_users WHERE name = $1`;
    const params = [username];
    const queryRes = await queryWrapper(query, params);
    if (queryRes.rows.length === 0) {
      return false;
    }
    return true;
  }
}
