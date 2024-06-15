import {Serianilla} from "../../framework/Serianilla.js";
import {LoginForm} from "../components/LoginForm.js";
import {SignUpForm} from "../components/SignUpForm.js";
import {Button} from "../components/ui/Button.js";
import {InputText} from "../components/ui/InputText.js";
import {InputPassword} from "../components/ui/InputPassword.js";
import {Loader} from "../components/ui/Loader.js";
import {login, signUp} from "../services/auth-service.js";
import {FRIENDS_ROUTE, LOGIN_ROUTE, SIGNUP_ROUTE} from "../utils/consts.js";

export const Auth = ({locationContext, notificationContext}) => {
    const [isLoading, setIsLoading] = Serianilla.useState(false);

    const isLogin = locationContext.pathname === LOGIN_ROUTE;

    const onValidLoginFormSubmit = async (formData) => {
        setIsLoading(true);
        const res = await login(formData);

        if (res.isSuccess) {
            notificationContext.displayMessage('Hurray!', res.message, 'success');
            locationContext.goTo(FRIENDS_ROUTE);
        } else {
            notificationContext.displayMessage('Oops!', res.message, 'error');
        }

        setIsLoading(false);
    }

    const onValidSignupFormSubmit = async (formData) => {
        setIsLoading(true);
        const res = await signUp(formData);

        if (res.isSuccess) {
            notificationContext.displayMessage('Hurray!', res.message, 'success');
            locationContext.goTo(FRIENDS_ROUTE);
        } else {
            notificationContext.displayMessage('Oops!', res.message, 'error');
        }

        setIsLoading(false);
    }

    const imports = [SignUpForm, LoginForm, InputText, InputPassword, Button, Loader];

    const template = `
    <div class={containerClass}>
        <div class="auth__tabs">
            <Button 
                classes="auth__tab {loginTabClass}" 
                onClick={setLogin} 
                content="Log in" />
            <Button 
                classes="auth__tab {signupTabClass}" 
                onClick={setSignUp} 
                content="Sign up" />
        </div>
        <div class="auth__form-container">
            <$if true={isLogin}>
                <LoginForm onValidSubmit={onValidLoginFormSubmit}/>                
            </$if>
            <$if false={isLogin}>
                <SignUpForm onValidSubmit={onValidSignupFormSubmit}/>                
            </$if>
            <$if true={isLoading}>
                <Loader/>            
            </$if>
        </div>
    </div>`;

    const attach = {
        isLogin,
        isLoading,
        onValidLoginFormSubmit,
        onValidSignupFormSubmit,
        loginTabClass: isLogin ? 'active' : '',
        signupTabClass: isLogin ? '' : 'active',
        containerClass: isLoading ? 'auth__container-loading' : 'auth__container',
        setLogin: () => locationContext.goTo(LOGIN_ROUTE),
        setSignUp: () => locationContext.goTo(SIGNUP_ROUTE),
    };

    return {imports, template, attach};
}