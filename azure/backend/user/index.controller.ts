import { Controller, Get, Response, Request } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserService } from './index.service';
import { environmentConfig } from 'src/config';

@ApiTags('User')
@Controller()
export class UserController {
  constructor(private readonly userServie: UserService) {}

  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 200 })
  @ApiOperation({ summary: 'user login' })
  @Get('user/login')
  login(@Response() res) {
    res.redirect(this.userServie.processLogin());
  }

  @Get('user/login_callback')
  async loginCallback(@Request() req, @Response() res) {
    let code = '';
    if (req.query.code) {
      code = req.query.code;
      const tokenInfo = await this.userServie.getAccessTokenByCode(code, req.log);
      // if redirect error, check cookie has refresh_token
      if (tokenInfo.error) {
        req.log.error(`user login callback error will redirect to login`);
        res.redirect('/login');
      } else {
        const { claimsInfo, user } = this.userServie.processAccessToken(tokenInfo.access_token);

        req.log.info(`login user name is ${user.id}`);
        const redirectUrl = `${environmentConfig.cx.frontend_url}?t=${claimsInfo}`;
        res.redirect(redirectUrl);
      }
    } else {
      req.log.error('ADFS grant code not found');
      res.status(400).json({ message: 'ADFS grant code not found' });
    }
  }

  @Get('user/logout')
  logout(@Response() res) {
    const OAuthConfig = this.userServie.getOAuthConfig();
    const url = `${OAuthConfig.url}/${OAuthConfig.tenant_id}/oauth2/v2.0/logout`;
    // ?post_logout_redirect_uri=${process.env.FRONTEND_URL}
    res.redirect(url);
  }


}
