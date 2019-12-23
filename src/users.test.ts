import { expect } from 'chai'
import { User, UserHandler } from './users'
import { LevelDB } from "./leveldb"
import { test } from 'mocha'

const dbPath: string = 'db_test/users'
let dbUser: UserHandler
let properUser: User
const email = "test@test.com"
const properName = "properUserName"
const password = "123"

describe('Users', function () {
    before(function () {
        LevelDB.clear(dbPath);
        dbUser = new UserHandler(dbPath);
        properUser = new User(properName, email, password);
    })

    describe('#Basic User Functions', function () {
        it('password stored should be different than input password', function () {
            let storedPassword = properUser.getPassword()
            expect(storedPassword).is.not.null;
            expect(storedPassword).is.not.equal(password);
        })

        it('should validate correct password to true', function () {
            let passwordIsCorrect = properUser.validatePassword(password);
            expect(passwordIsCorrect).is.true;
        })

        it("should validate incorrect password to false", function () {
            let passwordIsCorrect = properUser.validatePassword(password + "1");
            expect(passwordIsCorrect).is.false;
        })
    })

    describe("#Save user to database", function() {
        it("should save user to database, then retreive the same user", () => {
            dbUser.save(properUser, (err: Error | null) => {
                expect(err).is.null;
                dbUser.get(properUser.username, (err: Error | null, result?: User) => {
                    expect(err).is.null;
                    expect(result).is.not.undefined;
                    if (result !== undefined){
                        expect(result.username).is.equal(properUser.username);
                        expect(result.email).is.equal(properUser.email);
                        expect(result.getPassword()).is.equal(properUser.getPassword());
                        expect(result.validatePassword(password)).is.true;
                    }
                })
            })
        })
    });

    describe("#Delete user from database", function () {
        it("should delete user from database", () => {
            dbUser.save(properUser, (err: Error | null) => {
                expect(err).is.null;
                dbUser.delete(properUser.username, (err: Error | null) => {
                    expect(err).is.null;
                    dbUser.get(properUser.username, (err: Error | null, result?: User) => {
                        expect(err).is.not.null;
                        expect(err).is.not.undefined;
                    })
                })
            })
        })
    });

    after(function () {
        dbUser.db.close()
    });
})