import { Injectable, Logger, Request } from "@nestjs/common";
import { environmentConfig } from "src/config";
import axios from "axios";
import JWT from "jsonwebtoken";
// import ActiveDirectory from 'activedirectory';

@Injectable()
export class UserService {
  getOAuthConfig(): { [key: string]: string } {
    return {
      url: environmentConfig.azure.oauth2Url,
      client_id: environmentConfig.azure.client_id,
      tenant_id: environmentConfig.azure.tenant_id,
      redirect_url: environmentConfig.azure.redirect_url,
      client_secret: environmentConfig.azure.client_secret,
      scope: `openid%20offline_access%20profile%20email%20api://${environmentConfig.azure.client_id}/user_impersonation`,
      // %20https%3A%2F%2Fdsm.cathaypacific.com%2Foffline_access',
      // scope: 'offline_access',
      response_mode: "query",
      response_type: "code",
    };
  }

  processAccessToken(azureToken) {
    const auzraUserInfo = JWT.decode(azureToken);
    const {
      onPremisesSamAccountName = "",
      cn = "",
      name = "",
      family_name = "",
      given_name = "",
      username = "",
      groups = [],
    } = auzraUserInfo;
    // keep this to search from activedirectory
    let adKeyWord = "";
    let userName = "";
    // ete account without onPremisesSamAccountName
    if (onPremisesSamAccountName) {
      adKeyWord = onPremisesSamAccountName;
      userName = name;
      // get data from ete
    } else if (name) {
      adKeyWord = name;
      userName = `${given_name} ${family_name}`;
      // get data from jwt
    } else {
      adKeyWord = cn;
      userName = username;
    }

    const jwtToken = JWT.sign(
      {
        cn: adKeyWord,
        sAMAccountName: adKeyWord,
        username: userName,
        auth: "saml",
        thumbnail: "",
      },
      environmentConfig.cx.jwt_token_secret,
      //one day
      { expiresIn: 1 * 24 * 60 * 60 }
    );
    return { claimsInfo: jwtToken, user: { id: userName }, groups: groups };
  }

  processLogin(): string {
    const OAuthConfig = this.getOAuthConfig();
    const url = `${OAuthConfig.url}/${OAuthConfig.tenant_id}/oauth2/v2.0/authorize?client_id=${OAuthConfig.client_id}&response_type=${OAuthConfig.response_type}&redirect_uri=${OAuthConfig.redirect_url}&response_mode=${OAuthConfig.response_mode}&scope=${OAuthConfig.scope}`;
    return url;
  }
  /**
   *
   * @param code code from ms login api
   * @returns
   */
  async getAccessTokenByCode(code: string, log: Logger) {
    const OAuthConfig = this.getOAuthConfig();
    const data =
      "client_id=" +
      OAuthConfig.client_id +
      "&code=" +
      code +
      "&client_secret=" +
      OAuthConfig.client_secret +
      "&redirect_uri=" +
      OAuthConfig.redirect_url +
      "&grant_type=authorization_code";
    const url = `${OAuthConfig.url}/${OAuthConfig.tenant_id}/oauth2/v2.0/token`;
    let { data: tokenInfo } = await axios.post(url, data).catch((e) => {
      log.error(e);
      return { data: { error: true } };
    });
    return tokenInfo;
  }

}
