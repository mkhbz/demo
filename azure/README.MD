# Frontend

 - 首页路由拦截
 每次跳转页面的时候判断是否有token，如果没有就redirect 到登录页面
 初次登陆的时候，会带一个名为t的query，直接判断是否有就可以了。
```javacript
  <Route
        element={<DashboardPage />}
        loader={() => {
          return loaderInterceptor();
        }}
        path={ROUTES.DASHBOARD}
      />

```
```
const loaderInterceptor = () => {
  const jwtTokenStr = new URLSearchParams(location.search).get('t');
  if (jwtTokenStr) {
    jwtToCookie(jwtTokenStr);
  }
  const tokenInfo = getTokenFromCookie();
  if (!tokenInfo && !jwtTokenStr) {
    window.location.href = ROUTES.LOGIN;
  }
  return null;
};
```
 - 工具类
 将第一次登陆的放置到cookie中，目的就是每次都带到请求的header中去，如果想要用localStorage都可以
 ```
 使用js-cookie 包将数据放在cookie里面。
 ```
 - 退出账号
 个人在backend写了一个api，调用会跳转到azure的退出账号弹窗。
 ```
  window.location.href = `${EnvConfigs.apiBaseUrl}/user/logout`;
```
前端根据自己的条件判断是否 添加axios的401 redirect

#  Backend
用的是NestJs，与express差距不大，将就看吧
 - 请求参数设置
 在service.ts中设置参数，方便读取
 其他参数都可以找到，但注意scope。
 ```
   getOAuthConfig(): { [key: string]: string } {
    return {
      url: environmentConfig.azure.oauth2Url,
      client_id: environmentConfig.azure.client_id,
      tenant_id: environmentConfig.azure.tenant_id,
      redirect_url: environmentConfig.azure.redirect_url,
      client_secret: environmentConfig.azure.client_secret,
      scope: `openid%20offline_access%20profile%20email`,
      response_mode: 'query',
      response_type: 'code'
    };
  }

 ```
 1.当前端调用login接口时，重定向到azure的登录接口
```
  processLogin(): string {
    const OAuthConfig = this.getOAuthConfig();
    const url = `${OAuthConfig.url}/${OAuthConfig.tenant_id}/oauth2/v2.0/authorize?client_id=${OAuthConfig.client_id}&response_type=${OAuthConfig.response_type}&redirect_uri=${OAuthConfig.redirect_url}&response_mode=${OAuthConfig.response_mode}&scope=${OAuthConfig.scope}`;
    return url;
  }
```

2.azure 登录ok后会调用我们的api，本人将路径设置为/user/login_callback
需要拿到code然后调用服务去获取到token，jwt解析后获取到你想要的信息。

```
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
```

3.redirect到前端的时候，t就是我们的token了。

4.logout的时候直接调用azure的服务
```
  logout(@Response() res) {
    const OAuthConfig = this.userServie.getOAuthConfig();
    const url = `${OAuthConfig.url}/${OAuthConfig.tenant_id}/oauth2/v2.0/logout`;
    // ?post_logout_redirect_uri=${process.env.FRONTEND_URL}
    res.redirect(url);
  }
```
